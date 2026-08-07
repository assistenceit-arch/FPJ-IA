import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

import { CreateProcedimientoDto } from './dto/create-procedimiento.dto';
import { UpdateProcedimientoDto } from './dto/update-procedimiento.dto';
import { calcularDemoraExistente, validarOrdenFechas } from '../actuaciones-procedimiento/demora.util';

@Injectable()
export class ProcedimientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * WF-M1-001: genera el número interno EST-AAAA-CONSECUTIVO.
   * Consecutivo simple basado en el conteo de procedimientos del año.
   * (Para producción con alta concurrencia, esto debería ir en una
   * secuencia/transacción dedicada; queda documentado como mejora futura.)
   */
  private async generarNumeroInterno(): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await this.prisma.procedimiento.count({
      where: {
        numeroInterno: { startsWith: `EST-${anio}-` },
      },
    });
    const consecutivo = String(total + 1).padStart(6, '0');
    return `EST-${anio}-${consecutivo}`;
  }

  async create(dto: CreateProcedimientoDto, usuarioId: string, correoUsuario: string) {
    const numeroInterno = await this.generarNumeroInterno();

    const procedimiento = await this.prisma.procedimiento.create({
      data: {
        ...dto,
        estado: 'Borrador', // VF-006: el estado inicial lo controla el sistema, no el cliente.
        numeroInterno,
        usuarioId,
      },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Crear',
      tablaAfectada: 'procedimientos',
      registroAfectado: procedimiento.id,
      descripcionEvento: `Creación del procedimiento ${numeroInterno}`,
    });

    return procedimiento;
  }

  // WF-AUT-005: cada usuario ve únicamente sus propios procedimientos.
  findAll(usuarioId: string) {
    return this.prisma.procedimiento.findMany({
      where: { usuarioId, activo: true },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async findOne(id: string, usuarioId: string) {
    const procedimiento = await this.prisma.procedimiento.findUnique({
      where: { id },
    });

    if (!procedimiento || !procedimiento.activo) {
      throw new NotFoundException('Procedimiento no encontrado');
    }
    this.verificarPropiedad(procedimiento, usuarioId);

    // Adenda 2026-08-06: "Borrador"/"Finalizado" se recalcula cada vez
    // que se consulta el procedimiento (patrón "recompute-on-read"),
    // en vez de intentar sincronizarlo en cada uno de los muchos
    // endpoints que podrían afectar alguno de los 8 bloques. Como el
    // frontend consulta este endpoint en cada navegación entre bloques,
    // en la práctica queda al día. Decisión del usuario: Finalizado
    // cuando los 8 bloques del formulario único están en verde.
    const completo = await this.todosLosBloquesCompletos(procedimiento);
    const estadoCorrecto = completo ? 'Finalizado' : 'Borrador';
    if (procedimiento.estado !== estadoCorrecto) {
      return this.prisma.procedimiento.update({
        where: { id },
        data: { estado: estadoCorrecto },
      });
    }

    return procedimiento;
  }

  private textoCompleto(v: string | null | undefined): boolean {
    return Boolean(v && v.trim());
  }

  /**
   * Adenda 2026-08-06: en cuanto el procedimiento generó al menos un
   * documento oficial, se congela también la edición de sus propios
   * campos (ej. puesta a disposición) -- ver el mismo criterio en
   * ProcedimientoAccesoService.verificarNoBloqueado, usado por el resto
   * de submódulos.
   */
  private async verificarNoBloqueado(procedimientoId: string) {
    const cantidadGenerados = await this.prisma.documentoGenerado.count({
      where: { procedimientoId },
    });
    if (cantidadGenerados > 0) {
      throw new ForbiddenException(
        'Este procedimiento ya generó documentos oficiales y quedó bloqueado para edición. Solo se pueden descargar los documentos existentes.',
      );
    }
  }

  /**
   * Replica en el backend el mismo criterio de "completo" que ya usa el
   * frontend (src/lib/estados.ts) para pintar los 8 puntos de color del
   * menú lateral, para no depender de que el cliente reporte
   * honestamente si terminó o no.
   */
  private async todosLosBloquesCompletos(procedimiento: {
    id: string;
    fechaCaptura: Date;
    horaCaptura: string;
    fechaDisposicion: Date | null;
    horaDisposicion: string | null;
    exoneradoPago: boolean;
  }): Promise<boolean> {
    const [funcionario, lugar, capturados, actuaciones, documentosCount, pago] = await Promise.all([
      this.prisma.funcionarioActuante.findUnique({ where: { procedimientoId: procedimiento.id } }),
      this.prisma.lugarProcedimiento.findUnique({ where: { procedimientoId: procedimiento.id } }),
      this.prisma.capturado.findMany({
        where: { procedimientoId: procedimiento.id },
        include: { elementosIncautados: true },
      }),
      this.prisma.actuacionesProcedimiento.findUnique({ where: { procedimientoId: procedimiento.id } }),
      this.prisma.documentoGenerado.count({ where: { procedimientoId: procedimiento.id } }),
      this.prisma.pago.findUnique({ where: { procedimientoId: procedimiento.id } }),
    ]);

    // 1. Funcionario
    const funcionarioOk =
      !!funcionario &&
      [
        funcionario.nombreCompleto,
        funcionario.documento,
        funcionario.entidad,
        funcionario.cargo,
        funcionario.telefono,
        funcionario.correo,
        funcionario.placa,
        funcionario.zonaAtencion,
        funcionario.estacion,
        funcionario.servicio,
        funcionario.cai,
      ].every((v) => this.textoCompleto(v));

    // 2. Intervinientes (binario, igual que Elementos)
    const intervinientesOk = capturados.length > 0;

    // 3. Lugar
    const lugarOk =
      !!lugar &&
      [lugar.departamento, lugar.municipio, lugar.barrio, lugar.direccion].every((v) =>
        this.textoCompleto(v),
      );

    // 4. Elementos incautados (binario, suma de todos los intervinientes)
    const totalElementos = capturados.reduce((total, c) => total + c.elementosIncautados.length, 0);
    const elementosOk = totalElementos > 0;

    // 5. Actuaciones procedimentales
    let actuacionesOk = false;
    if (actuaciones) {
      const requeridos = [
        this.textoCompleto(actuaciones.autoridadReceptora),
        procedimiento.fechaDisposicion != null,
        this.textoCompleto(procedimiento.horaDisposicion),
      ];
      if (actuaciones.derechosLeidos) {
        requeridos.push(actuaciones.fechaDerechos != null, this.textoCompleto(actuaciones.horaDerechos));
      }
      if (actuaciones.presentaLesiones) {
        requeridos.push(this.textoCompleto(actuaciones.descripcionLesiones));
      }
      if (actuaciones.trasladoCentroAsistencial) {
        requeridos.push(
          this.textoCompleto(actuaciones.centroAsistencial),
          this.textoCompleto(actuaciones.motivoTraslado),
        );
      }
      if (calcularDemoraExistente(procedimiento)) {
        requeridos.push(this.textoCompleto(actuaciones.justificacionDemora));
      }

      const aprehendidos = capturados.filter((c) => c.tipoInterviniente === 'APREHENDIDO');
      const esposasOk = aprehendidos.every((a) => {
        if (a.usoEsposas === null || a.usoEsposas === undefined) return false;
        if (a.usoEsposas === true) return this.textoCompleto(a.justificacionEsposas);
        return true;
      });

      actuacionesOk = requeridos.every(Boolean) && esposasOk;
    }

    // 6. Relato de los hechos (comparte registro con Actuaciones)
    let relatoOk = false;
    if (actuaciones) {
      const requeridos = [
        this.textoCompleto(actuaciones.observacionInicial),
        this.textoCompleto(actuaciones.desarrolloIntervencion),
      ];
      if (actuaciones.tieneCircunstanciaRelevante) {
        requeridos.push(this.textoCompleto(actuaciones.circunstanciaRelevante));
      }
      if (actuaciones.tieneObservacionAdicional) {
        requeridos.push(this.textoCompleto(actuaciones.observacionAdicional));
      }
      relatoOk = requeridos.every(Boolean);
    }

    // 7. Documentos (al menos uno generado)
    const documentosOk = documentosCount > 0;

    // 8. Pago (verificado, o el procedimiento fue exonerado por un administrador)
    const pagoOk = procedimiento.exoneradoPago || pago?.estadoPago === 'Verificado';

    return (
      funcionarioOk &&
      intervinientesOk &&
      lugarOk &&
      elementosOk &&
      actuacionesOk &&
      relatoOk &&
      documentosOk &&
      pagoOk
    );
  }

  async update(
    id: string,
    dto: UpdateProcedimientoDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const existente = await this.findOne(id, usuarioId);
    await this.verificarNoBloqueado(id);

    // Adenda 2026-08-04: la puesta a disposición también puede llegar
    // por aquí (PATCH /procedimientos/:id, desde el formulario de
    // disposición del Bloque 5), así que la validación de orden de
    // fechas se repite aquí — antes solo se comprobaba al guardar
    // Actuaciones, y se podía guardar una disposición anterior a la
    // captura sin que nada lo detectara si nunca se volvía a tocar el
    // Bloque 5. Ver demora.util.ts.
    const fechaDisposicionNueva =
      dto.fechaDisposicion !== undefined
        ? dto.fechaDisposicion
          ? new Date(dto.fechaDisposicion)
          : null
        : existente.fechaDisposicion;
    const horaDisposicionNueva =
      dto.horaDisposicion !== undefined ? dto.horaDisposicion : existente.horaDisposicion;

    validarOrdenFechas({
      fechaCaptura: existente.fechaCaptura,
      horaCaptura: existente.horaCaptura,
      fechaDisposicion: fechaDisposicionNueva,
      horaDisposicion: horaDisposicionNueva,
    });

    const actualizado = await this.prisma.procedimiento.update({
      where: { id: existente.id },
      data: dto,
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Modificar',
      tablaAfectada: 'procedimientos',
      registroAfectado: actualizado.id,
      descripcionEvento: `Actualización del procedimiento ${actualizado.numeroInterno ?? actualizado.id}`,
    });

    return actualizado;
  }

  /**
   * RT-006 / AT-005: eliminación lógica, nunca física.
   * RI-005: no puede eliminarse un procedimiento con documentos generados.
   */
  async remove(id: string, usuarioId: string, correoUsuario: string) {
    const existente = await this.findOne(id, usuarioId);

    const documentosGenerados = await this.prisma.documentoGenerado.count({
      where: { procedimientoId: existente.id },
    });

    if (documentosGenerados > 0) {
      throw new BadRequestException(
        'No se puede eliminar un procedimiento que ya tiene documentos generados (RI-005).',
      );
    }

    const eliminado = await this.prisma.procedimiento.update({
      where: { id: existente.id },
      data: { activo: false, eliminadoEn: new Date() },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Eliminar',
      tablaAfectada: 'procedimientos',
      registroAfectado: eliminado.id,
      descripcionEvento: `Eliminación lógica del procedimiento ${eliminado.numeroInterno ?? eliminado.id}`,
    });

    return eliminado;
  }

  private verificarPropiedad(
    procedimiento: { usuarioId: string },
    usuarioId: string,
  ) {
    if (procedimiento.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'No tiene autorización para acceder a este procedimiento.',
      );
    }
  }

  /**
   * Panel de administración: lista PAGINADA de todos los procedimientos
   * (de cualquier funcionario), con búsqueda opcional por número
   * interno, para poder ubicar uno puntual y exonerarlo del pago.
   */
  async listarTodosAdmin(busqueda?: string, pagina = 1, porPagina = 10) {
    const where = {
      activo: true,
      ...(busqueda ? { numeroInterno: { contains: busqueda, mode: 'insensitive' as const } } : {}),
    };

    const [datos, total] = await Promise.all([
      this.prisma.procedimiento.findMany({
        where,
        select: {
          id: true,
          numeroInterno: true,
          tipoProcedimiento: true,
          estado: true,
          exoneradoPago: true,
          fechaCreacion: true,
          usuario: { select: { nombres: true, apellidos: true, correo: true } },
          pago: { select: { estadoPago: true } },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      this.prisma.procedimiento.count({ where }),
    ]);

    return { datos, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
  }

  /**
   * Adenda 2026-08-06: permite a un administrador exonerar (o revertir
   * la exoneración de) un procedimiento puntual del requisito de pago
   * para generar documentos. Decisión del usuario: sin motivo
   * obligatorio, queda igual registrado en auditoría.
   */
  async exonerarPago(id: string, exonerado: boolean, correoAdministrador: string) {
    const procedimiento = await this.prisma.procedimiento.findUnique({ where: { id } });
    if (!procedimiento || !procedimiento.activo) {
      throw new NotFoundException('Procedimiento no encontrado');
    }

    const actualizado = await this.prisma.procedimiento.update({
      where: { id },
      data: { exoneradoPago: exonerado },
    });

    await this.auditoria.registrar({
      usuario: correoAdministrador,
      accion: 'Modificar',
      tablaAfectada: 'procedimientos',
      registroAfectado: id,
      descripcionEvento: `${exonerado ? 'Exoneración' : 'Reversión de exoneración'} de pago para el procedimiento ${procedimiento.numeroInterno ?? id}`,
    });

    return actualizado;
  }
}
