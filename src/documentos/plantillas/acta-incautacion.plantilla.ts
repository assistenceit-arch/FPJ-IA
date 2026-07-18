import {
  AlignmentType,
  Document,
  ImageRun,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  BorderStyle,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { nombreMes, nombreCompleto } from './utilidades-texto';

const ESCUDO_PATH = path.join(process.cwd(), 'assets', 'documentos', 'escudo-policia-nacional.png');
const FUENTE = 'Arial';
const TAMANO_TEXTO = 22; // 11pt (docx usa medios puntos)
const TAMANO_ENCABEZADO = 20; // 10pt, para que el bloque de control quepa en un renglón

export interface DatosActaIncautacion {
  estacionPolicia: string;
  ciudad: string;
  fechaIncautacion: Date;
  horaIncautacion: string;
  barrio: string;
  capturado: {
    primerNombre: string;
    segundoNombre?: string | null;
    primerApellido: string;
    segundoApellido?: string | null;
    tipoDocumento?: string | null;
    numeroDocumento?: string | null;
    expedicionDocumento?: string | null;
    edad: number;
    fechaNacimiento: Date;
    lugarNacimiento?: string | null;
    direccion?: string | null;
  };
  elementos: { descripcion: string; observaciones?: string | null }[];
  funcionario: {
    nombreCompleto: string;
    placa: string;
    cargo: string;
  };
}

function texto(contenido: string, opciones: { bold?: boolean; size?: number } = {}) {
  return new TextRun({
    text: contenido,
    font: FUENTE,
    size: opciones.size ?? TAMANO_TEXTO,
    bold: opciones.bold,
  });
}

function parrafo(contenido: string): Paragraph {
  return new Paragraph({
    children: [texto(contenido)],
    spacing: { after: 180 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function parrafoCelda(
  contenido: string,
  opciones: { bold?: boolean; centrado?: boolean; size?: number } = {},
): Paragraph {
  return new Paragraph({
    children: [texto(contenido, { bold: opciones.bold, size: opciones.size ?? TAMANO_TEXTO })],
    spacing: { after: 40 },
    alignment: opciones.centrado ? AlignmentType.CENTER : undefined,
  });
}

const SIN_BORDE = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function celdaControl(lineas: string[], anchoPct: number): TableCell {
  return new TableCell({
    width: { size: anchoPct, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: lineas.map((l) => parrafoCelda(l, { centrado: true, size: TAMANO_ENCABEZADO })),
  });
}

/**
 * Encabezado de control documental, replicando exactamente la
 * combinación de celdas del formato original:
 * - Columna 1 (angosta): 4 filas independientes de metadatos.
 * - Columna 2 (ancha): "PROCEDIMIENTO..." (combinada filas 1-2) y
 *   "FORMATO..." (combinada filas 3-4).
 * - Columna 3: el escudo, combinada en las 4 filas.
 * Todo el texto va centrado, en una sola línea donde sea posible.
 */
function construirEncabezado(): Table {
  const etiqueta = parrafoCelda('POLICÍA NACIONAL', {
    bold: true,
    centrado: true,
    size: TAMANO_ENCABEZADO,
  });

  const contenidoCeldaEscudo = fs.existsSync(ESCUDO_PATH)
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: fs.readFileSync(ESCUDO_PATH),
              transformation: { width: 55, height: 65 },
              type: 'png',
            }),
          ],
        }),
        etiqueta,
      ]
    : [etiqueta];

  const ANCHO_COL1 = 22;
  const ANCHO_COL2 = 58;
  const ANCHO_COL3 = 20;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [
      Math.round(9360 * (ANCHO_COL1 / 100)),
      Math.round(9360 * (ANCHO_COL2 / 100)),
      Math.round(9360 * (ANCHO_COL3 / 100)),
    ],
    rows: [
      new TableRow({
        children: [
          celdaControl(['Página 1 de 1'], ANCHO_COL1),
          new TableCell({
            width: { size: ANCHO_COL2, type: WidthType.PERCENTAGE },
            rowSpan: 2,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              parrafoCelda('PROCEDIMIENTO: REALIZAR INCAUTACIÓN DE ELEMENTOS VARIOS', {
                bold: true,
                centrado: true,
                size: TAMANO_ENCABEZADO,
              }),
            ],
          }),
          new TableCell({
            width: { size: ANCHO_COL3, type: WidthType.PERCENTAGE },
            rowSpan: 4,
            verticalAlign: VerticalAlign.CENTER,
            children: contenidoCeldaEscudo,
          }),
        ],
      }),
      new TableRow({
        children: [celdaControl(['Código: 1CS-FR-0014'], ANCHO_COL1)],
      }),
      new TableRow({
        children: [
          celdaControl(['Fecha: 03-05-2014'], ANCHO_COL1),
          new TableCell({
            width: { size: ANCHO_COL2, type: WidthType.PERCENTAGE },
            rowSpan: 2,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              parrafoCelda('FORMATO: ACTA DE INCAUTACIÓN DE ELEMENTOS VARIOS', {
                bold: true,
                centrado: true,
                size: TAMANO_ENCABEZADO,
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [celdaControl(['Versión: 1'], ANCHO_COL1)],
      }),
    ],
  });
}

function construirObservaciones(elementos: DatosActaIncautacion['elementos']): Paragraph[] {
  const conObservacion = elementos
    .map((e, i) => ({ ...e, indice: i + 1 }))
    .filter((e) => e.observaciones && e.observaciones.trim().length > 0);

  if (conObservacion.length === 0) {
    return [
      new Paragraph({
        children: [texto('OBSERVACIONES: ', { bold: true }), texto('Sin observaciones.')],
        spacing: { after: 200 },
      }),
    ];
  }

  return [
    new Paragraph({
      children: [texto('OBSERVACIONES:', { bold: true })],
      spacing: { after: 80 },
    }),
    ...conObservacion.map(
      (e) =>
        new Paragraph({
          children: [texto(`Elemento ${e.indice}: ${e.observaciones}`)],
          spacing: { after: 80 },
          alignment: AlignmentType.JUSTIFIED,
        }),
    ),
  ];
}

export function construirActaIncautacion(datos: DatosActaIncautacion): Document {
  const fecha = datos.fechaIncautacion;
  const fechaNacimientoTexto = datos.capturado.fechaNacimiento
    ? `${datos.capturado.fechaNacimiento.getUTCDate()} de ${nombreMes(datos.capturado.fechaNacimiento)} de ${datos.capturado.fechaNacimiento.getUTCFullYear()}`
    : '____________________';

  const listaElementos = datos.elementos.map(
    (e, i) =>
      new Paragraph({
        children: [texto(`${i + 1}. ${e.descripcion}`)],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED,
      }),
  );

  return new Document({
    styles: {
      default: {
        document: { run: { font: FUENTE, size: TAMANO_TEXTO } },
      },
    },
    sections: [
      {
        properties: {
          page: { size: { width: 12240, height: 15840 } }, // Carta (US Letter)
        },
        children: [
          construirEncabezado(),

          new Paragraph({ spacing: { before: 300, after: 200 } }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [texto('ACTA DE INCAUTACIÓN DE ELEMENTOS VARIOS', { bold: true })],
            spacing: { after: 300 },
          }),

          parrafo(
            `Acta que trata de la incautación de unos elementos por parte de personal de la Policía Nacional adscrito a la estación de policía ${datos.estacionPolicia}.`,
          ),

          parrafo(
            `En la ciudad de ${datos.ciudad}, a los ${fecha.getUTCDate()} días del mes de ${nombreMes(fecha)} del año ${fecha.getUTCFullYear()}, siendo las ${datos.horaIncautacion} horas, se procede a realizar la incautación y recolección de los siguientes elementos hallados en el barrio ${datos.barrio}, a ${nombreCompleto(datos.capturado)}, identificado(a) con documento N.° ${datos.capturado.numeroDocumento ?? '____________________'}, de ${datos.capturado.edad} años de edad, nacido(a) el ${fechaNacimientoTexto} en ${datos.capturado.lugarNacimiento ?? '____________________'}, residente en ${datos.capturado.direccion ?? '____________________'}. Los elementos se relacionan a continuación:`,
          ),

          ...listaElementos,

          ...construirObservaciones(datos.elementos),

          parrafo(
            'No siendo otro el objeto de la presente diligencia, se da por terminada dejando constancia de la incautación realizada al ciudadano relacionado.',
          ),

          new Paragraph({ spacing: { before: 300 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      parrafoCelda('Quien hace la incautación:', { bold: true }),
                      parrafoCelda(`${datos.funcionario.cargo} ${datos.funcionario.nombreCompleto}`, { size: TAMANO_TEXTO }),
                      parrafoCelda(`Placa ${datos.funcionario.placa}`, { size: TAMANO_TEXTO }),
                      new Paragraph({ spacing: { before: 300 } }),
                      parrafoCelda('Firma: ____________________'),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      parrafoCelda('A quien se le incauta:', { bold: true }),
                      parrafoCelda(nombreCompleto(datos.capturado)),
                      parrafoCelda(`C.C. ${datos.capturado.numeroDocumento ?? '____________________'} de ${datos.capturado.expedicionDocumento ?? '____________________'}`),
                      new Paragraph({ spacing: { before: 200 } }),
                      parrafoCelda('Firma: ____________________'),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });
}