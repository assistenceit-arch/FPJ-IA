import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AccionAuditoria =
  | 'Crear'
  | 'Modificar'
  | 'Eliminar'
  | 'Regenerar'
  | 'Anular';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un evento de auditoría. RT-007: toda modificación debe generar
   * registro de auditoría. Esta tabla nunca se borra (AUDITORIA_EVENTOS).
   */
  async registrar(params: {
    usuario: string; // correo o id del usuario que ejecuta la acción
    accion: AccionAuditoria;
    tablaAfectada: string;
    registroAfectado: string;
    descripcionEvento: string;
  }) {
    return this.prisma.auditoriaEvento.create({
      data: {
        usuario: params.usuario,
        accion: params.accion,
        tablaAfectada: params.tablaAfectada,
        registroAfectado: params.registroAfectado,
        descripcionEvento: params.descripcionEvento,
      },
    });
  }
}
