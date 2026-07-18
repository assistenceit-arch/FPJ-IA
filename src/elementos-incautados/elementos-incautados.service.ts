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
      case 'SUSTANCIA':
        return `${dto.cantidadEmpaques} empaques que en su interior contienen una sustancia vegetal de color ${dto.color} con características similares a ${dto.caracteristicas}.`;

      case 'DINERO':
        return `Dinero en efectivo por valor de $${this.formatearValor(dto.valorTotal)} representado en: ${dto.denominaciones}.`;

      case 'CELULAR':
        return dto.imei
          ? `Teléfono celular marca ${dto.marca} color ${dto.color} IMEI ${dto.imei}.`
          : `Teléfono celular marca ${dto.marca} color ${dto.color}.`;

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

  private construirDatosDetalle(dto: CrearElementoDto) {
    switch (dto.tipoElemento) {
      case 'SUSTANCIA':
        return {
          detalleSustancia: {
            create: {
              cantidadEmpaques: dto.cantidadEmpaques!,
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
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
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

  async listar(procedimientoId: string, capturadoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
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
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
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
  ) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    await this.verificarCapturado(procedimientoId, capturadoId);
    await this.obtenerElementoOFallar(capturadoId, elementoId);

    const documentos = await this.prisma.documentoGenerado.count({
      where: { elementoId },
    });

    if (documentos > 0) {
      throw new BadRequestException(
        'No se puede eliminar este elemento: ya tiene documentos generados asociados (FPJ 7 / FPJ 8).',
      );
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