import {
  BadRequestException,
  Injectable,
  NotFoundException,
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
  rellenarPlantillaConBloqueRepetible,
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
const PLANTILLA_FPJ5_CAPTURADO = path.join(CARPETA_ASSETS, 'fpj5-plantilla-capturado.docx');
const PLANTILLA_FPJ5_APREHENDIDO = path.join(CARPETA_ASSETS, 'fpj5-plantilla-aprehendido.docx');
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

    const esAprehendido = capturados[0].tipoInterviniente === 'APREHENDIDO';
    // Procedimientos MIXTOS (adultos + adolescentes): se usa la plantilla
    // del PRIMER interviniente registrado. Limitación conocida — los datos
    // individuales de cada persona son correctos, pero el texto genérico
    // circundante (capturado/aprehendido) podría no coincidir para todos
    // si están mezclados. Pendiente de decisión del usuario (ver
    // RESUMEN_TECNICO_FPJ_IA.md punto 1).
    const plantilla = esAprehendido ? PLANTILLA_FPJ5_APREHENDIDO : PLANTILLA_FPJ5_CAPTURADO;

    const hoy = new Date();
    const anexos = await this.prisma.documentoGenerado.groupBy({
      by: ['tipoDocumento'],
      where: { procedimientoId },
      _count: { _all: true },
    });
    const contarAnexo = (tipo: string) =>
      String(anexos.find((a) => a.tipoDocumento === tipo)?._count._all ?? 0);

    const elementosGlobales = capturados.flatMap((c) => c.elementosIncautados);
    const descripcionElementos =
      elementosGlobales.length > 0
        ? elementosGlobales.map((e, i) => `${i + 1}. ${e.descripcionBase}`).join(' ')
        : 'No se registraron elementos incautados.';

    const digitosPrefijados = (
      obj: Record<string, string>,
      prefijo: string,
    ): Record<string, string> =>
      Object.fromEntries(Object.entries(obj).map(([k, v]) => [`${prefijo}_${k}`, v]));

    const datosGlobales: Record<string, string> = {
      DEPARTAMENTO: lugarProcedimiento.departamento,
      MUNICIPIO: lugarProcedimiento.municipio,
      FECHA_INFORME_ANIO: String(hoy.getUTCFullYear()),
      FECHA_INFORME_MES: String(hoy.getUTCMonth() + 1).padStart(2, '0'),
      FECHA_INFORME_DIA: String(hoy.getUTCDate()).padStart(2, '0'),
      DESTINO_INFORME: actuaciones.autoridadReceptora,
      DIRECCION: lugarProcedimiento.direccion,
      BARRIO: lugarProcedimiento.barrio,
      LOCALIDAD: oNoAporta(lugarProcedimiento.localidad),
      VEREDA: '', // N/A si no aplica (Mapa Documental FPJ5, sección 3)
      CARACTERISTICAS_LUGAR: oNoAporta(lugarProcedimiento.caracteristicas),
      DESCRIPCION_ELEMENTOS: descripcionElementos,
      NARRACION_HECHOS: resultado.texto,
      ANEXO_FPJ6_CANTIDAD: contarAnexo('FPJ6'),
      ANEXO_FPJ7_CANTIDAD: contarAnexo('FPJ7'),
      ANEXO_FPJ8_CANTIDAD: contarAnexo('FPJ8'),
      ANEXO_ACTA_CANTIDAD: contarAnexo('ACTA'),
      FUNCIONARIO_NOMBRE: funcionarioActuante.nombreCompleto,
      FUNCIONARIO_IDENTIFICACION: funcionarioActuante.documento,
      FUNCIONARIO_ENTIDAD: funcionarioActuante.entidad,
      FUNCIONARIO_CARGO: funcionarioActuante.cargo,
      FUNCIONARIO_TELEFONO: funcionarioActuante.telefono,
      FUNCIONARIO_CORREO: funcionarioActuante.correo,
      ...digitosPrefijados(digitosFecha(procedimiento.fechaCaptura), 'CAP'),
      ...digitosPrefijados(digitosHora(procedimiento.horaCaptura), 'CAP'),
      ...digitosPrefijados(digitosFecha(procedimiento.fechaDisposicion), 'DISP'),
      ...digitosPrefijados(digitosHora(procedimiento.horaDisposicion), 'DISP'),
    };

    const bloquesIntervinientes = capturados.map((c) => {
      const tipoDocNormalizado = (c.tipoDocumento ?? '').toUpperCase();
      const esCC = tipoDocNormalizado.includes('CC') || tipoDocNormalizado.includes('C.C');
      const generoM = (c.genero ?? '').toUpperCase().startsWith('M');

      return {
        PRIMER_NOMBRE: c.primerNombre,
        SEGUNDO_NOMBRE: oNoAporta(c.segundoNombre) === 'No aporta' ? '' : c.segundoNombre!,
        PRIMER_APELLIDO: c.primerApellido,
        SEGUNDO_APELLIDO: oNoAporta(c.segundoApellido) === 'No aporta' ? '' : c.segundoApellido!,
        ALIAS: c.alias ?? '',
        DOC_CHECK_CC: c.tipoDocumento ? (esCC ? 'X' : '') : '',
        DOC_CHECK_OTRA: c.tipoDocumento ? (esCC ? '' : 'X') : '',
        NUMERO_DOCUMENTO: oNoAporta(c.numeroDocumento),
        LUGAR_EXPEDICION: oNoAporta(c.expedicionDocumento),
        ...digitosPrefijados({ D1: String(c.edad).padStart(2, '0')[0], D2: String(c.edad).padStart(2, '0')[1] }, 'EDAD'),
        GENERO_CHECK_M: generoM ? 'X' : '',
        GENERO_CHECK_F: generoM ? '' : 'X',
        ...digitosPrefijados(digitosFecha(c.fechaNacimiento), 'FN'),
        LUGAR_NACIMIENTO: oNoAporta(c.lugarNacimiento),
        ESTADO_CIVIL: oNoAporta(c.estadoCivil),
        ESCOLARIDAD: oNoAporta(c.escolaridad),
        OCUPACION: oNoAporta(c.ocupacion),
        CORREO_REDES: oNoAporta(
          [c.correo, c.redesSociales].filter(Boolean).join(' / ') || undefined,
        ),
        SENALES_PARTICULARES: c.senalesParticulares ?? '', // en blanco si no se capturó (excepción a "No aporta")
        NOMBRE_PADRES: oNoAporta(c.nombrePadres),
        PADRES_CONTACTO: oNoAporta(c.telefonoPadres),
      };
    });

    const buffer = rellenarPlantillaConBloqueRepetible(
      plantilla,
      datosGlobales,
      bloquesIntervinientes,
    );

    const version =
      (await this.prisma.documentoGenerado.count({
        where: { procedimientoId, tipoDocumento: 'FPJ5' },
      })) + 1;

    const carpetaDestino = path.join(CARPETA_ALMACENAMIENTO, procedimientoId);
    fs.mkdirSync(carpetaDestino, { recursive: true });
    const nombreArchivo = `FPJ5-${procedimientoId}-v${version}.docx`;
    const rutaArchivo = path.join(carpetaDestino, nombreArchivo);
    fs.writeFileSync(rutaArchivo, buffer);

    const documentoGenerado = await this.prisma.documentoGenerado.create({
      data: {
        procedimientoId,
        tipoDocumento: 'FPJ5',
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
      descripcionEvento: `FPJ-5 generado (v${version}) para el procedimiento ${procedimientoId} con narración automática por IA.`,
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
