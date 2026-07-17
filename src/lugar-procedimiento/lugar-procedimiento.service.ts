import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { GuardarLugarProcedimientoDto } from './dto/guardar-lugar-procedimiento.dto';

@Injectable()
export class LugarProcedimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
  ) {}

  async obtener(procedimientoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    return this.prisma.lugarProcedimiento.findUnique({
      where: { procedimientoId },
    });
  }

  async guardar(
    procedimientoId: string,
    dto: GuardarLugarProcedimientoDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    const existente = await this.prisma.lugarProcedimiento.findUnique({
      where: { procedimientoId },
    });

    const resultado = await this.prisma.lugarProcedimiento.upsert({
      where: { procedimientoId },
      create: { ...dto, procedimientoId },
      update: { ...dto },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: existente ? 'Modificar' : 'Crear',
      tablaAfectada: 'lugares_procedimiento',
      registroAfectado: resultado.id,
      descripcionEvento: `${existente ? 'Actualización' : 'Registro'} del lugar del procedimiento ${procedimientoId}`,
    });

    return resultado;
  }
}
