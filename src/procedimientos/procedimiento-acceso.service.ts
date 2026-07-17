import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcedimientoAccesoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Confirma que el procedimiento existe, está activo (RT-006) y
   * pertenece al usuario autenticado (WF-AUT-005). Usado por todos los
   * submódulos que cuelgan de un procedimiento (funcionario, compañero,
   * lugar, capturados, elementos, actuaciones).
   */
  async verificarPropiedad(procedimientoId: string, usuarioId: string) {
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
}
