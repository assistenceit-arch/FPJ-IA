import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { CrearCapturadoDto } from './dto/crear-capturado.dto';
import { ActualizarCapturadoDto } from './dto/actualizar-capturado.dto';
import { GuardarContactoNotificacionDto } from './dto/guardar-contacto-notificacion.dto';

const NO_APORTO = 'No aportó';

@Injectable()
export class CapturadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
  ) {}

  /**
   * WF-M2 / UI-017 / UI-018: la edad y la condición jurídica (Capturado o
   * Aprehendido) SIEMPRE se calculan aquí, nunca se reciben del cliente.
   * Menor de 18 años = Aprehendido. 18 años o más = Capturado.
   */
  private calcularEdadYTipo(fechaNacimiento: string) {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const aunNoCumpleAnios =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() &&
        hoy.getDate() < nacimiento.getDate());
    if (aunNoCumpleAnios) {
      edad -= 1;
    }

    const tipoInterviniente = edad < 18 ? 'APREHENDIDO' : 'CAPTURADO';
    return { edad, tipoInterviniente };
  }

  /**
   * Prepara los datos a guardar aplicando las reglas de negocio:
   * - Limpia campos de acudiente si la persona es mayor de edad.
   * - Aplica "No aportó" a nombre/teléfono de padres si no se diligencian
   *   (UI-019).
   */
  private prepararDatos<T extends CrearCapturadoDto | ActualizarCapturadoDto>(
    dto: T,
    tipoInterviniente: string,
    edad: number,
    fechaNacimiento: Date,
  ) {
    const esAprehendido = tipoInterviniente === 'APREHENDIDO';

    return {
      ...dto,
      fechaNacimiento,
      edad,
      tipoInterviniente,
      nombrePadres: dto.nombrePadres?.trim() || NO_APORTO,
      telefonoPadres: dto.telefonoPadres?.trim() || NO_APORTO,
      nombreAcudiente: esAprehendido ? dto.nombreAcudiente ?? null : null,
      parentescoAcudiente: esAprehendido
        ? dto.parentescoAcudiente ?? null
        : null,
      telefonoAcudiente: esAprehendido ? dto.telefonoAcudiente ?? null : null,
    };
  }

  async crear(
    procedimientoId: string,
    dto: CrearCapturadoDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    const { edad, tipoInterviniente } = this.calcularEdadYTipo(
      dto.fechaNacimiento,
    );
    const datos = this.prepararDatos(
      dto,
      tipoInterviniente,
      edad,
      new Date(dto.fechaNacimiento),
    );

    try {
      const capturado = await this.prisma.capturado.create({
        data: { ...datos, procedimientoId },
      });

      await this.auditoria.registrar({
        usuario: correoUsuario,
        accion: 'Crear',
        tablaAfectada: 'capturados',
        registroAfectado: capturado.id,
        descripcionEvento: `Registro de interviniente (${tipoInterviniente}) en el procedimiento ${procedimientoId}`,
      });

      return capturado;
    } catch (error) {
      this.manejarErrorDuplicado(error);
      throw error;
    }
  }

  async listar(procedimientoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    return this.prisma.capturado.findMany({
      where: { procedimientoId },
      include: { contactoNotificacion: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async obtener(procedimientoId: string, capturadoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    return this.obtenerCapturadoOFallar(procedimientoId, capturadoId);
  }

  async actualizar(
    procedimientoId: string,
    capturadoId: string,
    dto: ActualizarCapturadoDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    const existente = await this.obtenerCapturadoOFallar(procedimientoId, capturadoId);

    const fechaNacimientoStr = dto.fechaNacimiento ?? existente.fechaNacimiento.toISOString();
    const { edad, tipoInterviniente } = this.calcularEdadYTipo(fechaNacimientoStr);
    const datos = this.prepararDatos(
      dto,
      tipoInterviniente,
      edad,
      new Date(fechaNacimientoStr),
    );

    try {
      const actualizado = await this.prisma.capturado.update({
        where: { id: capturadoId },
        data: datos,
      });

      await this.auditoria.registrar({
        usuario: correoUsuario,
        accion: 'Modificar',
        tablaAfectada: 'capturados',
        registroAfectado: actualizado.id,
        descripcionEvento: `Actualización del interviniente ${actualizado.id}`,
      });

      return actualizado;
    } catch (error) {
      this.manejarErrorDuplicado(error);
      throw error;
    }
  }

  /**
   * RI-002 (protección de integridad, mismo criterio que RI-005 en
   * procedimientos): no se puede eliminar un interviniente que ya tiene
   * elementos incautados o documentos generados asociados.
   */
  async eliminar(
    procedimientoId: string,
    capturadoId: string,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    await this.obtenerCapturadoOFallar(procedimientoId, capturadoId);

    const [elementos, documentos] = await Promise.all([
      this.prisma.elementoIncautado.count({ where: { capturadoId } }),
      this.prisma.documentoGenerado.count({ where: { capturadoId } }),
    ]);

    if (elementos > 0 || documentos > 0) {
      throw new BadRequestException(
        'No se puede eliminar este interviniente: ya tiene elementos incautados o documentos generados asociados.',
      );
    }

    await this.prisma.capturado.delete({ where: { id: capturadoId } });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Eliminar',
      tablaAfectada: 'capturados',
      registroAfectado: capturadoId,
      descripcionEvento: `Eliminación del interviniente ${capturadoId} (UI-022)`,
    });

    return { eliminado: true };
  }

  // ── Contacto de notificación (UI-020: obligatorio por interviniente) ──

  async obtenerContacto(
    procedimientoId: string,
    capturadoId: string,
    usuarioId: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    await this.obtenerCapturadoOFallar(procedimientoId, capturadoId);

    return this.prisma.contactoNotificacion.findUnique({
      where: { capturadoId },
    });
  }

  async guardarContacto(
    procedimientoId: string,
    capturadoId: string,
    dto: GuardarContactoNotificacionDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    await this.obtenerCapturadoOFallar(procedimientoId, capturadoId);

    const existente = await this.prisma.contactoNotificacion.findUnique({
      where: { capturadoId },
    });

    const datos = {
      nombre: dto.nombre?.trim() || NO_APORTO,
      identificacion: dto.identificacion?.trim() || NO_APORTO,
      telefono: dto.telefono?.trim() || NO_APORTO,
      comunicacionExitosa: dto.comunicacionExitosa,
      horaComunicacion: dto.horaComunicacion,
      justificacionNoComunicacion: dto.comunicacionExitosa
        ? null
        : dto.justificacionNoComunicacion,
    };

    const resultado = await this.prisma.contactoNotificacion.upsert({
      where: { capturadoId },
      create: { ...datos, capturadoId },
      update: datos,
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: existente ? 'Modificar' : 'Crear',
      tablaAfectada: 'contactos_notificacion',
      registroAfectado: resultado.id,
      descripcionEvento: `${existente ? 'Actualización' : 'Registro'} del contacto de notificación del interviniente ${capturadoId}`,
    });

    return resultado;
  }

  // ── Auxiliares privados ──

  private async obtenerCapturadoOFallar(procedimientoId: string, capturadoId: string) {
    const capturado = await this.prisma.capturado.findUnique({
      where: { id: capturadoId },
    });

    if (!capturado || capturado.procedimientoId !== procedimientoId) {
      throw new NotFoundException('Interviniente no encontrado');
    }

    return capturado;
  }

  // UI-021: no pueden existir dos intervinientes con el mismo tipo y
  // número de documento dentro del mismo procedimiento (aplicado también
  // a nivel de base de datos con una restricción única). Se detecta por
  // el código de error P2002, estable en cualquier versión de Prisma.
  private manejarErrorDuplicado(error: unknown) {
    const codigo = (error as { code?: string })?.code;
    if (codigo === 'P2002') {
      throw new BadRequestException(
        'Ya existe un interviniente con el mismo tipo y número de documento en este procedimiento (UI-021).',
      );
    }
  }
}