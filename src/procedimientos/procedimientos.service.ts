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

    return procedimiento;
  }

  async update(
    id: string,
    dto: UpdateProcedimientoDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const existente = await this.findOne(id, usuarioId);

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
}
