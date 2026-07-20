import AdmZip from 'adm-zip';

/**
 * Escapa un valor para insertarlo de forma segura dentro de XML de Word.
 */
function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Rellena una plantilla .docx real (con marcadores {{TOKEN}} ya insertados
 * en las celdas/líneas correspondientes) sustituyendo cada marcador por su
 * valor. Preserva el 100% del diseño original porque no reconstruye el
 * documento: solo reemplaza texto dentro del mismo archivo.
 */
export function rellenarPlantillaWord(
  rutaPlantilla: string,
  datos: Record<string, string>,
): Buffer {
  const zip = new AdmZip(rutaPlantilla);
  const entrada = zip.getEntry('word/document.xml');
  if (!entrada) {
    throw new Error(`La plantilla ${rutaPlantilla} no tiene word/document.xml`);
  }

  let xml = entrada.getData().toString('utf8');
  for (const [clave, valor] of Object.entries(datos)) {
    xml = xml.split(`{{${clave}}}`).join(escaparXml(valor));
  }

  zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
  return zip.toBuffer();
}

const NO_APORTA = 'No aporta';

/** Devuelve el valor si existe y no está vacío, o "No aporta" en su defecto. */
export function oNoAporta(valor?: string | null): string {
  const limpio = valor?.trim();
  return limpio ? limpio : NO_APORTA;
}

/** Divide una fecha en dígitos individuales D-D M-M A-A-A-A (para casillas). */
export function digitosFecha(fecha: Date) {
  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const anio = String(fecha.getUTCFullYear());
  return {
    D1: dia[0], D2: dia[1],
    M1: mes[0], M2: mes[1],
    A1: anio[0], A2: anio[1], A3: anio[2], A4: anio[3],
  };
}

/** Divide una hora "HH:MM" en dígitos individuales para casillas H-H-H-H. */
export function digitosHora(hora: string) {
  const limpio = hora.replace(':', '').padStart(4, '0');
  return { H1: limpio[0], H2: limpio[1], H3: limpio[2], H4: limpio[3] };
}

const MARCADOR_INICIO_BLOQUE_DEFECTO = '%%%BLOQUE_INTERVINIENTE_INICIO%%%';
const MARCADOR_FIN_BLOQUE_DEFECTO = '%%%BLOQUE_INTERVINIENTE_FIN%%%';

function rellenarFragmento(xml: string, datos: Record<string, string>): string {
  let resultado = xml;
  for (const [clave, valor] of Object.entries(datos)) {
    resultado = resultado.split(`{{${clave}}}`).join(escaparXml(valor));
  }
  return resultado;
}

/** Busca el inicio de la etiqueta <w:p> (con o sin atributos) que contiene `posicion`. */
function inicioDeParrafo(xml: string, posicion: number): number {
  const sinAtributos = xml.lastIndexOf('<w:p>', posicion);
  const conAtributos = xml.lastIndexOf('<w:p ', posicion);
  const candidato = Math.max(sinAtributos, conAtributos);
  if (candidato === -1) {
    throw new Error('No se encontró el inicio del párrafo que contiene el marcador de bloque.');
  }
  return candidato;
}

/** Busca el índice justo después del cierre </w:p> del párrafo que contiene `posicion`. */
function finDeParrafo(xml: string, posicion: number): number {
  const idx = xml.indexOf('</w:p>', posicion);
  if (idx === -1) {
    throw new Error('No se encontró el fin del párrafo que contiene el marcador de bloque.');
  }
  return idx + '</w:p>'.length;
}

/**
 * Rellena una plantilla .docx que contiene, además de marcadores simples
 * {{TOKEN}}, un bloque de contenido que debe repetirse una vez por cada
 * elemento de `bloques` (para el FPJ-5: la sección "4. INFORMACIÓN DEL
 * CAPTURADO(s)", una vez por cada interviniente — REGLA INV-FPJ5-003).
 *
 * El bloque a repetir debe estar delimitado en la plantilla por dos
 * párrafos "centinela" que contienen únicamente el texto de los marcadores
 * `marcadorInicio` / `marcadorFin` (por defecto
 * `%%%BLOQUE_INTERVINIENTE_INICIO%%%` / `%%%BLOQUE_INTERVINIENTE_FIN%%%`).
 * Ambos párrafos centinela se eliminan del documento final; el contenido
 * ubicado ESTRICTAMENTE ENTRE ellos es lo que se repite.
 *
 * `datosGlobales` se aplica a todo el documento (incluido el fragmento
 * repetido, para tokens que no varían por interviniente). Cada objeto de
 * `bloques` se combina con `datosGlobales` y se aplica a UNA copia del
 * fragmento repetible.
 */
export function rellenarPlantillaConBloqueRepetible(
  rutaPlantilla: string,
  datosGlobales: Record<string, string>,
  bloques: Array<Record<string, string>>,
  opciones: { marcadorInicio?: string; marcadorFin?: string } = {},
): Buffer {
  const marcadorInicio = opciones.marcadorInicio ?? MARCADOR_INICIO_BLOQUE_DEFECTO;
  const marcadorFin = opciones.marcadorFin ?? MARCADOR_FIN_BLOQUE_DEFECTO;

  const zip = new AdmZip(rutaPlantilla);
  const entrada = zip.getEntry('word/document.xml');
  if (!entrada) {
    throw new Error(`La plantilla ${rutaPlantilla} no tiene word/document.xml`);
  }
  const xmlOriginal = entrada.getData().toString('utf8');

  const posInicioTexto = xmlOriginal.indexOf(marcadorInicio);
  const posFinTexto = xmlOriginal.indexOf(marcadorFin);
  if (posInicioTexto === -1 || posFinTexto === -1) {
    throw new Error(
      `No se encontraron los marcadores de bloque repetible ('${marcadorInicio}' / '${marcadorFin}') en la plantilla ${rutaPlantilla}.`,
    );
  }

  const inicioParrafoMarcadorInicio = inicioDeParrafo(xmlOriginal, posInicioTexto);
  const finParrafoMarcadorInicio = finDeParrafo(xmlOriginal, posInicioTexto);
  const inicioParrafoMarcadorFin = inicioDeParrafo(xmlOriginal, posFinTexto);
  const finParrafoMarcadorFin = finDeParrafo(xmlOriginal, posFinTexto);

  const fragmentoRepetible = xmlOriginal.slice(
    finParrafoMarcadorInicio,
    inicioParrafoMarcadorFin,
  );

  const fragmentoFinal = bloques
    .map((datosBloque) =>
      rellenarFragmento(fragmentoRepetible, { ...datosGlobales, ...datosBloque }),
    )
    .join('');

  let xml =
    xmlOriginal.slice(0, inicioParrafoMarcadorInicio) +
    fragmentoFinal +
    xmlOriginal.slice(finParrafoMarcadorFin);

  // Resto de marcadores globales fuera del bloque repetible.
  xml = rellenarFragmento(xml, datosGlobales);

  zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
  return zip.toBuffer();
}
