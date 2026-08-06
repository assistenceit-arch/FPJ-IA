import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { ConfiguracionPagosService } from '../configuracion-pagos/configuracion-pagos.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { VerificarPagoDto } from './dto/verificar-pago.dto';

const ESTADO_INICIAL = 'Pendiente';

// Adenda 2026-08-05: el comprobante de la transferencia (adjunto
// obligatorio) se guarda en disco con el mismo patrón que los documentos
// generados (src/documentos/documentos.service.ts, CARPETA_ALMACENAMIENTO).
const CARPETA_COMPROBANTES = path.join(process.cwd(), 'storage', 'comprobantes-pago');
const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

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
    comprobante: Express.Multer.File | undefined,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(
      procedimientoId,
      usuarioId,
    );

    // Adenda 2026-08-05: el comprobante ahora es un archivo obligatorio
    // (imagen o PDF), no texto libre -- debe evidenciar como mínimo la
    // fecha, el número de referencia y el valor del movimiento, a
    // solicitud del usuario. El backend no puede verificar el CONTENIDO
    // del archivo (eso lo revisa el administrador al aprobar/rechazar),
    // solo que efectivamente se haya adjuntado uno válido.
    if (!comprobante) {
      throw new BadRequestException(
        'Debe adjuntar el comprobante de la transferencia (imagen o PDF) donde se vea la fecha, el número de referencia y el valor del movimiento.',
      );
    }
    if (!TIPOS_PERMITIDOS[comprobante.mimetype]) {
      throw new BadRequestException(
        'El comprobante debe ser una imagen (JPG, PNG o WEBP) o un PDF.',
      );
    }
    if (comprobante.size > TAMANO_MAXIMO_BYTES) {
      throw new BadRequestException('El comprobante no puede superar los 10 MB.');
    }

    const existente = await this.prisma.pago.findUnique({
      where: { procedimientoId },
    });
    // Un pago Rechazado permite volver a registrar uno nuevo (Adenda
    // 2026-08-05); solo se bloquea si ya hay uno Pendiente o Verificado.
    if (existente && existente.estadoPago !== 'Rechazado') {
      throw new ConflictException(
        'Este procedimiento ya tiene un pago registrado. Consulte su estado en vez de crear uno nuevo.',
      );
    }

    const configuracion = await this.configuracionPagos.obtenerOFallar();
    const valor =
      procedimiento.tipoProcedimiento === 'COMPLEJO'
        ? configuracion.valorComplejo
        : configuracion.valorEstandar;

    const rutaComprobante = this.guardarComprobante(procedimientoId, comprobante);

    const datos = {
      fechaPago: new Date(dto.fechaPago),
      valor,
      medioPago: dto.medioPago,
      referenciaPago: dto.referenciaPago,
      comprobantePago: rutaComprobante,
      estadoPago: ESTADO_INICIAL,
    };

    const pago = existente
      ? await this.prisma.pago.update({ where: { procedimientoId }, data: datos })
      : await this.prisma.pago.create({ data: { procedimientoId, ...datos } });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: existente ? 'Modificar' : 'Crear',
      tablaAfectada: 'pagos',
      registroAfectado: pago.id,
      descripcionEvento: `${existente ? 'Nuevo pago registrado (reintento tras rechazo anterior)' : 'Pago registrado'} por $${valor} para el procedimiento ${procedimientoId} (${procedimiento.tipoProcedimiento})`,
    });

    return pago;
  }

  private guardarComprobante(procedimientoId: string, archivo: Express.Multer.File): string {
    const carpeta = path.join(CARPETA_COMPROBANTES, procedimientoId);
    fs.mkdirSync(carpeta, { recursive: true });
    const extension =
      path.extname(archivo.originalname) || TIPOS_PERMITIDOS[archivo.mimetype] || '';
    const nombreArchivo = `comprobante-${Date.now()}${extension}`;
    const rutaCompleta = path.join(carpeta, nombreArchivo);
    fs.writeFileSync(rutaCompleta, archivo.buffer);
    return rutaCompleta;
  }

  /**
   * Adenda 2026-08-05: los administradores necesitan poder CONSULTAR el
   * pago (y su comprobante) de procedimientos que no son suyos para
   * poder revisarlos antes de aprobar/rechazar -- antes solo la acción
   * de verificar estaba abierta a cualquier procedimiento, pero no la
   * consulta, así que en la práctica un administrador no podía ver qué
   * estaba aprobando salvo que fuera dueño del procedimiento.
   */
  async obtener(procedimientoId: string, usuarioId: string, rol: string) {
    if (rol === 'ADMINISTRADOR') {
      await this.acceso.verificarExiste(procedimientoId);
    } else {
      await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    }
    return this.prisma.pago.findUnique({ where: { procedimientoId } });
  }

  async obtenerRutaComprobante(procedimientoId: string, usuarioId: string, rol: string) {
    if (rol === 'ADMINISTRADOR') {
      await this.acceso.verificarExiste(procedimientoId);
    } else {
      await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    }

    const pago = await this.prisma.pago.findUnique({ where: { procedimientoId } });
    if (!pago || !pago.comprobantePago) {
      throw new NotFoundException('Este procedimiento no tiene un comprobante de pago adjunto.');
    }
    if (!fs.existsSync(pago.comprobantePago)) {
      throw new NotFoundException('El archivo del comprobante no existe en el servidor.');
    }
    return pago.comprobantePago;
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
