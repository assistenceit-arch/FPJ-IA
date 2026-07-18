import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ActualizarConfiguracionPagosDto } from './dto/actualizar-configuracion-pagos.dto';

@Injectable()
export class ConfiguracionPagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * No se inventa un valor por defecto: si el administrador aún no ha
   * configurado los montos, se devuelve null explícitamente y el módulo
   * de Pagos rechazará la creación de pagos hasta que se configure.
   */
  async obtener() {
    const configuraciones = await this.prisma.configuracionPagos.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });
    return configuraciones[0] ?? null;
  }

  async obtenerOFallar() {
    const configuracion = await this.obtener();
    if (!configuracion) {
      throw new NotFoundException(
        'Los valores de pago aún no han sido configurados por un administrador.',
      );
    }
    return configuracion;
  }

  async actualizar(
    dto: ActualizarConfiguracionPagosDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const existente = await this.obtener();

    const resultado = existente
      ? await this.prisma.configuracionPagos.update({
          where: { id: existente.id },
          data: { ...dto, actualizadoPor: correoUsuario },
        })
      : await this.prisma.configuracionPagos.create({
          data: { ...dto, actualizadoPor: correoUsuario },
        });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: existente ? 'Modificar' : 'Crear',
      tablaAfectada: 'configuracion_pagos',
      registroAfectado: resultado.id,
      descripcionEvento: `Configuración de pagos actualizada: ESTANDAR=$${dto.valorEstandar}, COMPLEJO=$${dto.valorComplejo}`,
    });

    return resultado;
  }
}
