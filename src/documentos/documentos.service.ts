import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Packer } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { construirActaIncautacion } from './plantillas/acta-incautacion.plantilla';

// RT-005: los documentos generados se almacenan físicamente en el servidor.
const CARPETA_ALMACENAMIENTO = path.join(process.cwd(), 'storage', 'documentos-generados');

@Injectable()
export class DocumentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
  ) {}

  async generarActaIncautacion(
    procedimientoId: string,
    capturadoId: string,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    const capturado = await this.prisma.capturado.findUnique({
      where: { id: capturadoId },
      include: { elementosIncautados: true },
    });
    if (!capturado || capturado.procedimientoId !== procedimientoId) {
      throw new NotFoundException('Interviniente no encontrado en este procedimiento.');
    }
    if (capturado.elementosIncautados.length === 0) {
      throw new BadRequestException(
        'Este interviniente no tiene elementos incautados registrados; no hay nada que documentar en el Acta.',
      );
    }

    const [funcionarioActuante, lugarProcedimiento] = await Promise.all([
      this.prisma.funcionarioActuante.findUnique({ where: { procedimientoId } }),
      this.prisma.lugarProcedimiento.findUnique({ where: { procedimientoId } }),
    ]);
    if (!funcionarioActuante) {
      throw new BadRequestException(
        'Debe registrar el funcionario actuante antes de generar el Acta de Incautación.',
      );
    }
    if (!lugarProcedimiento) {
      throw new BadRequestException(
        'Debe registrar el lugar del procedimiento antes de generar el Acta de Incautación.',
      );
    }

    const documento = construirActaIncautacion({
      estacionPolicia: funcionarioActuante.estacion,
      ciudad: lugarProcedimiento.municipio,
      fechaIncautacion: procedimiento.fechaCaptura,
      horaIncautacion: procedimiento.horaCaptura,
      barrio: lugarProcedimiento.barrio,
      capturado: {
        primerNombre: capturado.primerNombre,
        segundoNombre: capturado.segundoNombre,
        primerApellido: capturado.primerApellido,
        segundoApellido: capturado.segundoApellido,
        tipoDocumento: capturado.tipoDocumento,
        numeroDocumento: capturado.numeroDocumento,
        expedicionDocumento: capturado.expedicionDocumento,
        edad: capturado.edad,
        fechaNacimiento: capturado.fechaNacimiento,
        lugarNacimiento: capturado.lugarNacimiento,
        direccion: capturado.direccion,
      },
      elementos: capturado.elementosIncautados.map((e) => ({
        descripcion: e.descripcionBase,
        observaciones: e.observaciones,
      })),
      funcionario: {
        nombreCompleto: funcionarioActuante.nombreCompleto,
        placa: funcionarioActuante.placa,
        cargo: funcionarioActuante.cargo,
      },
    });

    const buffer = await Packer.toBuffer(documento);

    const version =
      (await this.prisma.documentoGenerado.count({
        where: { capturadoId, tipoDocumento: 'ACTA' },
      })) + 1;

    const carpetaDestino = path.join(CARPETA_ALMACENAMIENTO, procedimientoId);
    fs.mkdirSync(carpetaDestino, { recursive: true });
    const nombreArchivo = `ACTA-${capturado.id}-v${version}.docx`;
    const rutaArchivo = path.join(carpetaDestino, nombreArchivo);
    fs.writeFileSync(rutaArchivo, buffer);

    const documentoGenerado = await this.prisma.documentoGenerado.create({
      data: {
        procedimientoId,
        tipoDocumento: 'ACTA',
        capturadoId,
        fechaGeneracion: new Date(),
        version,
        procedimientoVersion: 1, // Simplificación inicial; se refina en una fase posterior.
        rutaArchivo,
        estado: version > 1 ? 'Regenerado' : 'Generado',
      },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: version > 1 ? 'Regenerar' : 'Crear',
      tablaAfectada: 'documentos_generados',
      registroAfectado: documentoGenerado.id,
      descripcionEvento: `Acta de Incautación generada (v${version}) para el interviniente ${capturadoId}`,
    });

    return documentoGenerado;
  }

  async obtenerArchivo(documentoId: string, usuarioId: string) {
    const documento = await this.prisma.documentoGenerado.findUnique({
      where: { id: documentoId },
    });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado.');
    }
    await this.acceso.verificarPropiedad(documento.procedimientoId, usuarioId);

    if (!fs.existsSync(documento.rutaArchivo)) {
      throw new NotFoundException('El archivo físico del documento no existe en el servidor.');
    }

    return documento;
  }

  async listar(procedimientoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);
    return this.prisma.documentoGenerado.findMany({
      where: { procedimientoId },
      orderBy: { fechaGeneracion: 'desc' },
    });
  }
}
