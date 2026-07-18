import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { ConfiguracionPagosService } from '../configuracion-pagos/configuracion-pagos.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { VerificarPagoDto } from './dto/verificar-pago.dto';

const ESTADO_INICIAL = 'Pendiente';

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
    private readonly configuracionPagos: ConfiguracionPagosService,
  ) {}

  async registrar(
    procedimientoId: string,
    dto: RegistrarPagoDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(
      procedimientoId,
      usuarioId,
    );

    const existente = await this.prisma.pago.findUnique({
      where: { procedimientoId },
    });
    if (existente) {
      throw new ConflictException(
        'Este procedimiento ya tiene un pago registrado. Consulte su estado en vez de crear uno nuevo.',
      );
    }

    const configuracion = await this.configuracionPagos.obtenerOFallar();
    const valor =
      procedimiento.tipoProcedimiento === 'COMPLEJO'
        ? configuracion.valorComplejo
        : configuracion.valorEstandar;

    const pago = await this.prisma.pago.create({
      data: {
        procedimientoId,
        fechaPago: new Date(dto.fechaPago),
        valor,
        medioPago: dto.medioPago,
        referenciaPago: dto.referenciaPago,
        comprobantePago: dto.comprobantePago,
        estadoPago: ESTADO_INICIAL,
      },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Crear',
      tablaAfectada: 'pagos',
      registroAfectado: pago.id,
      descripcionEvento: `Pago registrado por $${valor} para el procedimiento ${procedimientoId} (${procedimiento.tipoProcedimiento})`,
    });

    return pago;
  }

  async obtener(procedimientoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    return this.prisma.pago.findUnique({ where: { procedimientoId } });
  }

  async verificar(
    procedimientoId: string,
    dto: VerificarPagoDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    await this.acceso.verificarExiste(procedimientoId);

    const pago = await this.prisma.pago.findUnique({ where: { procedimientoId } });
    if (!pago) {
      throw new NotFoundException('Este procedimiento no tiene un pago registrado.');
    }
    if (pago.estadoPago !== 'Pendiente') {
      throw new BadRequestException(
        `Este pago ya fue procesado (estado actual: ${pago.estadoPago}). No se puede verificar de nuevo.`,
      );
    }

    const actualizado = await this.prisma.pago.update({
      where: { procedimientoId },
      data: { estadoPago: dto.estadoPago },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: 'Modificar',
      tablaAfectada: 'pagos',
      registroAfectado: actualizado.id,
      descripcionEvento: `Pago ${dto.estadoPago.toLowerCase()} para el procedimiento ${procedimientoId}${dto.observacion ? `: ${dto.observacion}` : ''}`,
    });

    return actualizado;
     }
   }