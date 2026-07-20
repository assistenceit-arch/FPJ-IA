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
