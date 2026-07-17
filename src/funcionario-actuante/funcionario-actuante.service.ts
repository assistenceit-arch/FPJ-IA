import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { GuardarFuncionarioActuanteDto } from './dto/guardar-funcionario-actuante.dto';

@Injectable()
export class FuncionarioActuanteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * Confirma que el procedimiento existe, está activo y pertenece al
   * usuario autenticado. Reutilizado por todos los submódulos del
   * procedimiento (funcionario, compañero, lugar, capturados, etc.).
   */
  private async verificarProcedimiento(procedimientoId: string, usuarioId: string) {
    const procedimiento = await this.prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento || !procedimiento.activo) {
      throw new NotFoundException('Procedimiento no encontrado');
    }
    if (procedimiento.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'No tiene autorización para modificar este procedimiento.',
      );
    }
    return procedimiento;
  }

  async obtener(procedimientoId: string, usuarioId: string) {
    await this.verificarProcedimiento(procedimientoId, usuarioId);

    return this.prisma.funcionarioActuante.findUnique({
      where: { procedimientoId },
    });
  }

  /**
   * WF-M1-004/005: no existen botones manuales de guardado. Este método
   * crea el registro si no existe, o lo actualiza si ya existe.
   */
  async guardar(
    procedimientoId: string,
    dto: GuardarFuncionarioActuanteDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.verificarProcedimiento(procedimientoId, usuarioId);

    const existente = await this.prisma.funcionarioActuante.findUnique({
      where: { procedimientoId },
    });

    const resultado = await this.prisma.funcionarioActuante.upsert({
      where: { procedimientoId },
      create: { ...dto, procedimientoId },
      update: { ...dto },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: existente ? 'Modificar' : 'Crear',
      tablaAfectada: 'funcionario_actuante',
      registroAfectado: resultado.id,
      descripcionEvento: `${existente ? 'Actualización' : 'Registro'} del funcionario actuante del procedimiento ${procedimientoId}`,
    });

    return resultado;
  }
}
