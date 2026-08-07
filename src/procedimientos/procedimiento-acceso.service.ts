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

  /**
   * Confirma solo que el procedimiento existe y está activo, SIN exigir
   * que pertenezca al usuario que consulta. Uso exclusivo de acciones
   * administrativas que deben poder operar sobre procedimientos de
   * cualquier funcionario (ej. verificar un pago), y que ya están
   * protegidas por RolesGuard a nivel de controlador.
   */
  async verificarExiste(procedimientoId: string) {
    const procedimiento = await this.prisma.procedimiento.findUnique({
      where: { id: procedimientoId },
    });

    if (!procedimiento || !procedimiento.activo) {
      throw new NotFoundException('Procedimiento no encontrado');
    }
    return procedimiento;
  }

  /**
   * Adenda 2026-08-06: en cuanto un procedimiento generó al menos UN
   * documento oficial, se congela toda la información base (funcionario,
   * compañero, lugar, intervinientes, elementos, actuaciones, puesta a
   * disposición) -- de lo contrario un funcionario podía editar los
   * datos y volver a generar documentos con contenido distinto al que
   * ya se usó oficialmente. Solo queda disponible descargar lo ya
   * generado y generar documentos que NUNCA se hayan generado antes
   * (ej. el FPJ-6 de un segundo interviniente), ya que la información
   * de la que dependen quedó congelada y por lo tanto sigue siendo
   * consistente -- ver DocumentosService para esa segunda regla.
   */
  async verificarNoBloqueado(procedimientoId: string) {
    const cantidadGenerados = await this.prisma.documentoGenerado.count({
      where: { procedimientoId },
    });
    if (cantidadGenerados > 0) {
      throw new ForbiddenException(
        'Este procedimiento ya generó documentos oficiales y quedó bloqueado para edición. Solo se pueden descargar los documentos existentes.',
      );
    }
  }
}