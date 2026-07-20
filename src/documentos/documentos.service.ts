import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { Packer } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { NarrativaService } from '../narrativa/narrativa.service';
import { construirActaIncautacion } from './plantillas/acta-incautacion.plantilla';
import {
  rellenarPlantillaWord,
  oNoAporta,
  digitosFecha,
  digitosHora,
} from './plantillas/rellenar-plantilla-word';
import { AclaracionRequeridaException } from './excepciones/aclaracion-requerida.exception';
import type { ContextoNarracionFpj5 } from '../narrativa/interfaces/contexto-narracion.interface';

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
    private readonly narrativa: NarrativaService,
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

  /**
   * Genera el FPJ-5 (Informe de Captura en Flagrancia). RN-001 / REGLA
   * INV-FPJ5-003: se genera UN ÚNICO FPJ-5 por procedimiento, relacionando
   * a todos los intervinientes (no uno por cada capturado, a diferencia
   * del FPJ-6 y del Acta de Incautación).
   *
   * La sección 9 (narración de los hechos) se genera automáticamente por
   * IA. Si el modelo detecta información faltante o inconsistente según
   * las reglas del CORE (CORE_TRANSVERSAL + ESTUPEFACIENTES), este método
   * lanza AclaracionRequeridaException (409) con la pregunta exacta, SIN
   * generar ni guardar ningún documento. El cliente debe reenviar la
   * solicitud agregando la respuesta del funcionario en `aclaraciones`.
   */
  async generarFpj5Informe(
    procedimientoId: string,
    usuarioId: string,
    correoUsuario: string,
    aclaraciones: string[] = [],
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    const [funcionarioActuante, companeroPatrulla, lugarProcedimiento, actuaciones, capturados] =
      await Promise.all([
        this.prisma.funcionarioActuante.findUnique({ where: { procedimientoId } }),
        this.prisma.companeroPatrulla.findUnique({ where: { procedimientoId } }),
        this.prisma.lugarProcedimiento.findUnique({ where: { procedimientoId } }),
        this.prisma.actuacionesProcedimiento.findUnique({ where: { procedimientoId } }),
        this.prisma.capturado.findMany({
          where: { procedimientoId },
          include: { elementosIncautados: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    if (!funcionarioActuante) {
      throw new BadRequestException('Debe registrar el funcionario actuante antes de generar el FPJ-5.');
    }
    if (!lugarProcedimiento) {
      throw new BadRequestException('Debe registrar el lugar del procedimiento antes de generar el FPJ-5.');
    }
    if (!actuaciones) {
      throw new BadRequestException(
        'Debe registrar las actuaciones procedimentales antes de generar el FPJ-5.',
      );
    }
    if (capturados.length === 0) {
      throw new BadRequestException('Debe registrar al menos un interviniente antes de generar el FPJ-5.');
    }

    const contexto: ContextoNarracionFpj5 = {
      procedimiento: {
        delito: procedimiento.delito,
        tipoProcedimiento: procedimiento.tipoProcedimiento,
        fechaCaptura: procedimiento.fechaCaptura.toISOString(),
        horaCaptura: procedimiento.horaCaptura,
        fechaDisposicion: procedimiento.fechaDisposicion.toISOString(),
        horaDisposicion: procedimiento.horaDisposicion,
      },
      funcionario: {
        nombreCompleto: funcionarioActuante.nombreCompleto,
        cargo: funcionarioActuante.cargo,
        placa: funcionarioActuante.placa,
        servicio: funcionarioActuante.servicio,
        estacion: funcionarioActuante.estacion,
      },
      companero: companeroPatrulla
        ? { nombreCompleto: companeroPatrulla.nombreCompleto, placa: companeroPatrulla.placa }
        : null,
      lugar: {
        departamento: lugarProcedimiento.departamento,
        municipio: lugarProcedimiento.municipio,
        barrio: lugarProcedimiento.barrio,
        direccion: lugarProcedimiento.direccion,
        caracteristicas: lugarProcedimiento.caracteristicas,
      },
      intervinientes: capturados.map((c) => ({
        tipoInterviniente: c.tipoInterviniente,
        nombreCompleto: [c.primerNombre, c.segundoNombre, c.primerApellido, c.segundoApellido]
          .filter(Boolean)
          .join(' '),
        edad: c.edad,
        tipoDocumento: c.tipoDocumento,
        numeroDocumento: c.numeroDocumento,
        elementos: c.elementosIncautados.map((e) => ({
          tipoElemento: e.tipoElemento,
          descripcionBase: e.descripcionBase,
          ubicacionHallazgo: e.ubicacionHallazgo,
          direccionIncautacion: e.direccionIncautacion,
          observaciones: e.observaciones,
        })),
      })),
      actuaciones: {
        derechosLeidos: actuaciones.derechosLeidos,
        fechaDerechos: actuaciones.fechaDerechos.toISOString(),
        horaDerechos: actuaciones.horaDerechos,
        comprendeDerechos: actuaciones.comprendeDerechos,
        usoEsposas: actuaciones.usoEsposas,
        justificacionEsposas: actuaciones.justificacionEsposas,
        presentaLesiones: actuaciones.presentaLesiones,
        descripcionLesiones: actuaciones.descripcionLesiones,
        trasladoCentroAsistencial: actuaciones.trasladoCentroAsistencial,
        centroAsistencial: actuaciones.centroAsistencial,
        motivoTraslado: actuaciones.motivoTraslado,
        autoridadReceptora: actuaciones.autoridadReceptora,
        demoraExistente: actuaciones.demoraExistente,
        justificacionDemora: actuaciones.justificacionDemora,
      },
    };

    const resultado = await this.narrativa.generarNarracion(contexto, aclaraciones);

    if (resultado.tipo === 'aclaracion_requerida') {
      throw new AclaracionRequeridaException(resultado.pregunta);
    }

    // ⚠️ BLOQUEADO (2026-07-20): las plantillas Word del FPJ-5
    // (fpj5-plantilla-capturado.docx / fpj5-plantilla-aprehendido.docx)
    // todavía no existen físicamente en assets/documentos/ — se
    // construyeron en una sesión anterior de Claude, pero el sandbox donde
    // se generaron no persiste entre sesiones y el parche correspondiente
    // nunca se aplicó al repositorio. Deben reconstruirse a partir del
    // FPJ-5 oficial del usuario con python-docx (mismo procedimiento que
    // fpj6-plantilla-*.docx), insertando los marcadores {{TOKEN}} descritos
    // en 8.2 MAPA-DOCUMENTAL-FPJ5-V1 y el nuevo marcador
    // {{NARRACION_HECHOS}} en la sección 9 (tabla 34), más los dos párrafos
    // centinela %%%BLOQUE_INTERVINIENTE_INICIO%%% / ...FIN%%% alrededor de
    // la sección 4 (información del capturado/aprehendido), para poder
    // usar `rellenarPlantillaConBloqueRepetible`.
    //
    // La narración ya se generó correctamente en este punto (`resultado.texto`)
    // y no se pierde: se devuelve en el mensaje de la excepción para que
    // pueda conservarse mientras se completan las plantillas.
    throw new NotImplementedException(
      'La narración de los hechos se generó correctamente, pero el ensamblado ' +
        'final del documento FPJ-5 está pendiente de las plantillas Word ' +
        '(fpj5-plantilla-capturado.docx / fpj5-plantilla-aprehendido.docx). ' +
        'Narración generada:\n\n' +
        resultado.texto,
    );
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
