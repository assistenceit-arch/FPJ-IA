import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Packer } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { construirActaIncautacion } from './plantillas/acta-incautacion.plantilla';
import {
  rellenarPlantillaWord,
  oNoAporta,
  digitosFecha,
  digitosHora,
} from './plantillas/rellenar-plantilla-word';

// RT-005: los documentos generados se almacenan físicamente en el servidor.
const CARPETA_ALMACENAMIENTO = path.join(process.cwd(), 'storage', 'documentos-generados');
const CARPETA_ASSETS = path.join(process.cwd(), 'assets', 'documentos');
const PLANTILLA_FPJ6_CAPTURADO = path.join(CARPETA_ASSETS, 'fpj6-plantilla-capturado.docx');
const PLANTILLA_FPJ6_APREHENDIDO = path.join(CARPETA_ASSETS, 'fpj6-plantilla-aprehendido.docx');
const OBSERVACIONES_VACIAS = '_'.repeat(94); // igual longitud que la línea original en blanco

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

  async generarFpj6ActaDerechos(
    procedimientoId: string,
    capturadoId: string,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    const capturado = await this.prisma.capturado.findUnique({
      where: { id: capturadoId },
      include: { contactoNotificacion: true },
    });
    if (!capturado || capturado.procedimientoId !== procedimientoId) {
      throw new NotFoundException('Interviniente no encontrado en este procedimiento.');
    }

    const [funcionarioActuante, lugarProcedimiento, actuaciones] = await Promise.all([
      this.prisma.funcionarioActuante.findUnique({ where: { procedimientoId } }),
      this.prisma.lugarProcedimiento.findUnique({ where: { procedimientoId } }),
      this.prisma.actuacionesProcedimiento.findUnique({ where: { procedimientoId } }),
    ]);
    if (!funcionarioActuante) {
      throw new BadRequestException('Debe registrar el funcionario actuante antes de generar el FPJ-6.');
    }
    if (!lugarProcedimiento) {
      throw new BadRequestException('Debe registrar el lugar del procedimiento antes de generar el FPJ-6.');
    }
    if (!actuaciones) {
      throw new BadRequestException(
        'Debe registrar las actuaciones procedimentales (lectura de derechos) antes de generar el FPJ-6.',
      );
    }

    const esAprehendido = capturado.tipoInterviniente === 'APREHENDIDO';
    const nombreCompletoCapturado = [
      capturado.primerNombre,
      capturado.segundoNombre,
      capturado.primerApellido,
      capturado.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');

    // Contacto: si no se logró obtener NINGÚN dato del acudiente/representante,
    // la hora queda en blanco y se deja la constancia automática en Observaciones.
    const contacto = capturado.contactoNotificacion;
    const contactoDesconocido =
      !contacto ||
      (oNoAporta(contacto.nombre) === 'No aporta' &&
        oNoAporta(contacto.identificacion) === 'No aporta' &&
        oNoAporta(contacto.telefono) === 'No aporta');

    const observaciones = contactoDesconocido
      ? `Se deja constancia de que no fue posible informar de la situación jurídica del ${esAprehendido ? 'aprehendido' : 'capturado'}(a) al no lograr obtener información del acudiente, representante o persona indicada por él/ella.`
      : OBSERVACIONES_VACIAS;

    const fechaDig = digitosFecha(actuaciones.fechaDerechos);
    const horaDig = digitosHora(actuaciones.horaDerechos);
    const fechaBt = actuaciones.fechaDerechos;

    const datos: Record<string, string> = {
      ...fechaDig,
      ...horaDig,
      LUGAR_PROCEDIMIENTO: lugarProcedimiento.direccion,
      TRANS: '',
      NOMBRES: nombreCompletoCapturado,
      IDENTIFICACION: capturado.numeroDocumento
        ? `${capturado.tipoDocumento ?? ''} ${capturado.numeroDocumento}`.trim()
        : 'No aporta',
      FECHA_NAC: capturado.fechaNacimiento.toLocaleDateString('es-CO'),
      LUGAR_NAC: oNoAporta(capturado.lugarNacimiento),
      PADRES: oNoAporta(capturado.nombrePadres),
      ESTADO_CIVIL: oNoAporta(capturado.estadoCivil),
      OCUPACION: oNoAporta(capturado.ocupacion),
      DIR_TEL_INTERVINIENTE: oNoAporta(
        [capturado.direccion, capturado.telefono].filter(Boolean).join(' - ') || undefined,
      ),
      CORREO: oNoAporta(capturado.correo),
      REDES: oNoAporta(capturado.redesSociales),
      COMPRENDE: actuaciones.comprendeDerechos ? '(SÍ)' : '(NO)',
      C_NOMBRES: oNoAporta(contacto?.nombre),
      C_IDENTIFICACION: oNoAporta(contacto?.identificacion),
      C_TELEFONO: oNoAporta(contacto?.telefono),
      C_HORA: contactoDesconocido ? '' : oNoAporta(contacto?.horaComunicacion),
      OBSERVACIONES: observaciones,
      FUNCIONARIO_INFO: `${funcionarioActuante.cargo} ${funcionarioActuante.nombreCompleto} - Placa ${funcionarioActuante.placa}`,
      BT_CIUDAD: lugarProcedimiento.municipio,
      BT_DIA: String(fechaBt.getUTCDate()),
      BT_MES: fechaBt.toLocaleDateString('es-CO', { month: 'long' }),
      BT_ANIO: String(fechaBt.getUTCFullYear()),
      BT_HORA: actuaciones.horaDerechos,
      BT_NOMBRE: nombreCompletoCapturado,
      BT_CEDULA: oNoAporta(capturado.numeroDocumento),
      BT_FECHA_NAC: capturado.fechaNacimiento.toLocaleDateString('es-CO'),
      BT_EDAD: String(capturado.edad),
      BT_ESTADO_CIVIL: oNoAporta(capturado.estadoCivil),
      BT_INDICIADO: '',
      BT_IMPUTADO: '',
      BT_DELITO: procedimiento.delito,
    };

    const plantilla = esAprehendido ? PLANTILLA_FPJ6_APREHENDIDO : PLANTILLA_FPJ6_CAPTURADO;
    const buffer = rellenarPlantillaWord(plantilla, datos);

    const version =
      (await this.prisma.documentoGenerado.count({
        where: { capturadoId, tipoDocumento: 'FPJ6' },
      })) + 1;

    const carpetaDestino = path.join(CARPETA_ALMACENAMIENTO, procedimientoId);
    fs.mkdirSync(carpetaDestino, { recursive: true });
    const nombreArchivo = `FPJ6-${capturado.id}-v${version}.docx`;
    const rutaArchivo = path.join(carpetaDestino, nombreArchivo);
    fs.writeFileSync(rutaArchivo, buffer);

    const documentoGenerado = await this.prisma.documentoGenerado.create({
      data: {
        procedimientoId,
        tipoDocumento: 'FPJ6',
        capturadoId,
        fechaGeneracion: new Date(),
        version,
        procedimientoVersion: 1,
        rutaArchivo,
        estado: version > 1 ? 'Regenerado' : 'Generado',
      },
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: version > 1 ? 'Regenerar' : 'Crear',
      tablaAfectada: 'documentos_generados',
      registroAfectado: documentoGenerado.id,
      descripcionEvento: `FPJ-6 (Acta de Derechos del ${capturado.tipoInterviniente}) generado (v${version}) para el interviniente ${capturadoId}`,
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
