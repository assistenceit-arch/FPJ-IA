import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { CrearElementoDto } from './dto/crear-elemento.dto';
import { ActualizarElementoDto } from './dto/actualizar-elemento.dto';

const NO_SUMINISTRADO = 'N/A';

@Injectable()
export class ElementosIncautadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
  ) {}

  /**
   * RN-006/RN-007 (MMDD Módulo 6, reglas INV-FPJ7-004/005/006/007):
   * construye la descripción base única del elemento, que luego se
   * reutilizará sin cambios en el Acta de Incautación, el FPJ 7 y el FPJ 8.
   */
  private construirDescripcionBase(dto: CrearElementoDto | ActualizarElementoDto): string {
    switch (dto.tipoElemento) {
      case 'SUSTANCIA': {
        // Adenda 2026-08-11: dos correcciones a solicitud del usuario:
        // 1) tipoEmpaque (bolsas, papeletas, frascos, cajas, pastillas...)
        //    en vez de la palabra fija "empaques", que no reflejaba cómo
        //    venía realmente empacada la sustancia.
        // 2) tipoSustancia (vegetal, pulverulenta, etc.) en vez del
        //    valor fijo "vegetal" -- el campo ya se capturaba en el
        //    formulario ("Tipo de sustancia") pero nunca se usaba aquí,
        //    así que la descripción decía "vegetal" sin importar lo que
        //    el funcionario hubiera escrito.
        const empaque = dto.tipoEmpaque?.trim() || 'empaques';
        return `${dto.cantidadEmpaques} ${empaque} que en su interior contienen una sustancia ${dto.tipoSustancia} de color ${dto.color} con características similares a ${dto.caracteristicas}.`;
      }

      case 'DINERO':
        return `Dinero en efectivo por valor de $${this.formatearValor(dto.valorTotal)} representado en: ${dto.denominaciones}.`;

      case 'CELULAR':
        return dto.imei
          ? `Teléfono celular marca ${dto.marca} color ${dto.color} IMEI ${dto.imei}.`
          : `Teléfono celular marca ${dto.marca} color ${dto.color}.`;

      case 'ARMA':
        return this.construirDescripcionArma(dto);

      case 'OTRO':
        // REGLA INV-ACTA-007: la descripción es la registrada por el
        // funcionario, tal cual.
        return dto.descripcionManual ?? '';

      default:
        throw new BadRequestException('Tipo de elemento no reconocido.');
    }
  }

  private formatearValor(valor?: number): string {
    return new Intl.NumberFormat('es-CO').format(valor ?? 0);
  }

  /**
   * Adenda 2026-08-12: descripción del arma de fuego. Cada parte
   * opcional (marca, modelo, color, serial, munición, cargadores) solo
   * se incluye si el funcionario la diligenció -- una hechiza, por
   * ejemplo, normalmente no tiene marca ni modelo.
   */
  /**
   * Adenda 2026-08-13: no incluir en la descripción ningún campo vacío
   * ni cuyo valor sea una de las variantes de "se desconoce" -- a
   * solicitud del usuario, para que la descripción final del formato
   * no arrastre campos sin información real.
   */
  private tieneValor(v?: string | null): boolean {
    if (!v) return false;
    const normalizado = v.trim().toLowerCase();
    if (normalizado === '') return false;
    return !['desconozco', 'desconocido', 'desconocida', 'no aporta', 'n/a', 'ninguno', 'ninguna'].includes(
      normalizado,
    );
  }

  private construirDescripcionArma(dto: CrearElementoDto | ActualizarElementoDto): string {
    const ETIQUETAS_TIPO: Record<string, string> = {
      PISTOLA: 'pistola',
      REVOLVER: 'revólver',
      ESCOPETA: 'escopeta',
      FUSIL: 'fusil',
      HECHIZA: 'arma de fuego hechiza o artesanal',
    };
    const ETIQUETAS_ESTADO: Record<string, string> = {
      BUEN_ESTADO: 'buen estado',
      REGULAR_ESTADO: 'regular estado',
      MAL_ESTADO: 'mal estado',
    };

    const tipo = ETIQUETAS_TIPO[dto.tipoArma ?? ''] ?? 'arma de fuego';
    // Adenda 2026-08-13: "01" fijo -- cada registro de elemento ARMA
    // describe siempre una sola arma (a diferencia de SUSTANCIA, donde
    // cantidadEmpaques sí varía).
    const partes: string[] = [`01 arma de fuego tipo ${tipo}`];
    if (this.tieneValor(dto.marca)) partes.push(`marca ${dto.marca}`);
    if (this.tieneValor(dto.modelo)) partes.push(`modelo ${dto.modelo}`);
    if (this.tieneValor(dto.calibre)) partes.push(`calibre ${dto.calibre}`);
    if (this.tieneValor(dto.color)) partes.push(`color ${dto.color}`);

    if (this.tieneValor(dto.cachaMaterial) || this.tieneValor(dto.cachaColor)) {
      const piezasCacha = [
        this.tieneValor(dto.cachaMaterial) ? dto.cachaMaterial : null,
        this.tieneValor(dto.cachaColor) ? `color ${dto.cachaColor}` : null,
      ].filter(Boolean);
      partes.push(`empuñadura ${piezasCacha.join(' ')}`);
    }

    // Serial: NO_PRESENTA se omite por completo de la descripción (no
    // hay nada que consignar); el resto de estados sí se menciona
    // expresamente, sea legible o no.
    switch (dto.estadoSerial) {
      case 'LEGIBLE':
        if (this.tieneValor(dto.serial)) partes.push(`de serial ${dto.serial}`);
        break;
      case 'BORRADO':
        partes.push('de serial borrado');
        break;
      case 'ALTERADO':
        partes.push('de serial alterado');
        break;
      case 'NO_LEGIBLE':
        partes.push('de serial no legible');
        break;
      // NO_PRESENTA (o ausente): sin cláusula de serial.
    }

    const estado = ETIQUETAS_ESTADO[dto.estadoArma ?? ''] ?? dto.estadoArma;
    let descripcion = `${partes.join(', ')}, en ${estado}.`;

    const extras: string[] = [];
    if (dto.cantidadMuniciones != null && dto.cantidadMuniciones > 0) {
      const calibreMunicion = this.tieneValor(dto.calibreMunicion) ? ` calibre ${dto.calibreMunicion}` : '';
      extras.push(`${dto.cantidadMuniciones} cartuchos de munición${calibreMunicion}`);
    }
    if (dto.cantidadCargadores != null && dto.cantidadCargadores > 0) {
      extras.push(`${dto.cantidadCargadores} proveedor(es)`);
    }
    if (extras.length > 0) {
      descripcion += ` Además se hallaron ${extras.join(' y ')}.`;
    }

    return descripcion;
  }

  private construirDatosDetalle(dto: CrearElementoDto) {
    switch (dto.tipoElemento) {
      case 'SUSTANCIA':
        return {
          detalleSustancia: {
            create: {
              cantidadEmpaques: dto.cantidadEmpaques!,
              tipoEmpaque: dto.tipoEmpaque,
              tipoSustancia: dto.tipoSustancia!,
              color: dto.color!,
              caracteristicas: dto.caracteristicas!,
            },
          },
        };
      case 'DINERO':
        return {
          detalleDinero: {
            create: {
              valorTotal: dto.valorTotal!,
              denominaciones: dto.denominaciones!,
            },
          },
        };
      case 'CELULAR':
        return {
          detalleCelular: {
            create: {
              marca: dto.marca!,
              color: dto.color!,
              imei: dto.imei,
            },
          },
        };
      case 'ARMA':
        return {
          detalleArma: {
            create: {
              tipoArma: dto.tipoArma!,
              marca: dto.marca,
              modelo: dto.modelo,
              calibre: dto.calibre,
              color: dto.color,
              cachaMaterial: dto.cachaMaterial,
              cachaColor: dto.cachaColor,
              serial: dto.serial,
              estadoSerial: dto.estadoSerial!,
              estadoArma: dto.estadoArma!,
              cantidadMuniciones: dto.cantidadMuniciones,
              calibreMunicion: dto.calibreMunicion,
              cantidadCargadores: dto.cantidadCargadores,
            },
          },
        };
      case 'OTRO':
        return {
          detalleOtro: {
            create: {
              descripcionManual: dto.descripcionManual!,
            },
          },
        };
    }
  }

  async crear(
    procedimientoId: string,
    capturadoId: string,
    dto: CrearElementoDto,
    usuarioId: string,
    correoUsuario: string,
    rol?: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId, rol);
    await this.acceso.verificarNoBloqueado(procedimientoId);
    await this.acceso.verificarPagoComplejoAprobado(procedimientoId);
    await this.verificarCapturado(procedimientoId, capturadoId);

    const descripcionBase = this.construirDescripcionBase(dto);
    const detalle = this.construirDatosDetalle(dto);

    const elemento = await this.prisma.elementoIncautado.create({
      data: {
        procedimientoId,
        capturadoId,
        tipoElemento: dto.tipoElemento,
        descripcionBase,
        ubicacionHallazgo: dto.ubicacionHallazgo?.trim() || NO_SUMINISTRADO,
        direccionIncautacion: dto.direccionIncautacion,
        observaciones: dto.observaciones?.trim() || null,
        ...detalle,
      },
      include: {
        detalleSustancia: true,
        detalleDinero: true,
        detalleCelular: true,
        detalleOtro: true,
      },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Crear',
      tablaAfectada: 'elementos_incautados',
      registroAfectado: elemento.id,
      descripcionEvento: `Registro de elemento (${dto.tipoElemento}) para el interviniente ${capturadoId}`,
    });

    return elemento;
  }

  async listar(procedimientoId: string, capturadoId: string, usuarioId: string, rol?: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId, rol);
    await this.verificarCapturado(procedimientoId, capturadoId);

    return this.prisma.elementoIncautado.findMany({
      where: { capturadoId },
      include: {
        detalleSustancia: true,
        detalleDinero: true,
        detalleCelular: true,
        detalleOtro: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async obtener(
    procedimientoId: string,
    capturadoId: string,
    elementoId: string,
    usuarioId: string,
    rol?: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId, rol);
    await this.verificarCapturado(procedimientoId, capturadoId);
    return this.obtenerElementoOFallar(capturadoId, elementoId);
  }

  /**
   * RI similar a la de capturados/procedimientos: no se puede eliminar un
   * elemento que ya tiene un FPJ7/FPJ8/Acta generados (RT-006, RI-011,
   * RI-012 aplicadas por analogía: no puede existir un documento
   * huérfano).
   */
  async eliminar(
    procedimientoId: string,
    capturadoId: string,
    elementoId: string,
    usuarioId: string,
    correoUsuario: string,
    rol?: string,
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(procedimientoId, usuarioId, rol);
    await this.acceso.verificarNoBloqueado(procedimientoId);
    await this.acceso.verificarPagoComplejoAprobado(procedimientoId);
    await this.verificarCapturado(procedimientoId, capturadoId);
    await this.obtenerElementoOFallar(capturadoId, elementoId);

    // Adenda 2026-08-13: si un administrador desbloqueó la edición del
    // procedimiento, se omite esta verificación -- permite eliminar un
    // elemento aunque ya tenga documentos generados (FPJ 7 / FPJ 8),
    // para poder corregir la información y regenerarlos después.
    if (!procedimiento.edicionDesbloqueada) {
      const documentos = await this.prisma.documentoGenerado.count({
        where: { elementoId },
      });

      if (documentos > 0) {
        throw new BadRequestException(
          'No se puede eliminar este elemento: ya tiene documentos generados asociados (FPJ 7 / FPJ 8). Un administrador puede desbloquear la edición desde el panel si hace falta corregirlo.',
        );
      }
    }

    await this.prisma.elementoIncautado.delete({ where: { id: elementoId } });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Eliminar',
      tablaAfectada: 'elementos_incautados',
      registroAfectado: elementoId,
      descripcionEvento: `Eliminación del elemento ${elementoId} del interviniente ${capturadoId}`,
    });

    return { eliminado: true };
  }

  // ── Auxiliares privados ──

  private async verificarCapturado(procedimientoId: string, capturadoId: string) {
    const capturado = await this.prisma.capturado.findUnique({
      where: { id: capturadoId },
    });

    if (!capturado || capturado.procedimientoId !== procedimientoId) {
      throw new NotFoundException('Interviniente no encontrado en este procedimiento.');
    }

    return capturado;
  }

  private async obtenerElementoOFallar(capturadoId: string, elementoId: string) {
    const elemento = await this.prisma.elementoIncautado.findUnique({
      where: { id: elementoId },
      include: {
        detalleSustancia: true,
        detalleDinero: true,
        detalleCelular: true,
        detalleOtro: true,
      },
    });

    if (!elemento || elemento.capturadoId !== capturadoId) {
      throw new NotFoundException('Elemento no encontrado para este interviniente.');
    }

    return elemento;
  }
}