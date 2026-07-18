import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { CrearAsesoriaDto } from './dto/crear-asesoria.dto';
import { ActualizarAsesoriaDto } from './dto/actualizar-asesoria.dto';

const ESTADO_INICIAL = 'Pendiente';

@Injectable()
export class AsesoriaComplejaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
  ) {}

  /**
   * PC-005: genera el ticket único TK-AAAA-CONSECUTIVO, con la misma
   * lógica de consecutivo anual que ya usa el número interno del
   * procedimiento (EST-AAAA-CONSECUTIVO).
   */
  private async generarNumeroTicket(): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await this.prisma.asesoriaCompleja.count({
      where: { numeroTicket: { startsWith: `TK-${anio}-` } },
    });
    const consecutivo = String(total + 1).padStart(6, '0');
    return `TK-${anio}-${consecutivo}`;
  }

  async crear(
    procedimientoId: string,
    dto: CrearAsesoriaDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(
      procedimientoId,
      usuarioId,
    );

    // PC-001: solo los procedimientos clasificados como COMPLEJO pueden
    // tener una asesoría especializada.
    if (procedimiento.tipoProcedimiento !== 'COMPLEJO') {
      throw new BadRequestException(
        'Solo los procedimientos clasificados como COMPLEJO pueden generar una asesoría especializada (PC-001). Cambie el tipo de procedimiento primero.',
      );
    }

    const existente = await this.prisma.asesoriaCompleja.findUnique({
      where: { procedimientoId },
    });
    if (existente) {
      throw new ConflictException(
        `Este procedimiento ya tiene una asesoría con ticket ${existente.numeroTicket}. Use la edición en vez de crear una nueva.`,
      );
    }

    const numeroTicket = await this.generarNumeroTicket();

    const asesoria = await this.prisma.asesoriaCompleja.create({
      data: {
        procedimientoId,
        numeroTicket,
        motivoConsulta: dto.motivoConsulta,
        observacionesCaso: dto.observacionesCaso,
        estadoAsesoria: ESTADO_INICIAL,
      },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Crear',
      tablaAfectada: 'asesoria_compleja',
      registroAfectado: asesoria.id,
      descripcionEvento: `Ticket ${numeroTicket} generado para el procedimiento ${procedimientoId}`,
    });

    return asesoria;
  }

  async obtener(procedimientoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    return this.prisma.asesoriaCompleja.findUnique({ where: { procedimientoId } });
  }

  async actualizar(
    procedimientoId: string,
    dto: ActualizarAsesoriaDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    const existente = await this.prisma.asesoriaCompleja.findUnique({
      where: { procedimientoId },
    });
    if (!existente) {
      throw new NotFoundException(
        'Este procedimiento no tiene una asesoría creada. Créela primero.',
      );
    }

    const actualizada = await this.prisma.asesoriaCompleja.update({
      where: { procedimientoId },
      data: dto,
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Modificar',
      tablaAfectada: 'asesoria_compleja',
      registroAfectado: actualizada.id,
      descripcionEvento: `Actualización de la asesoría ${actualizada.numeroTicket}`,
    });

    return actualizada;
  }
}
