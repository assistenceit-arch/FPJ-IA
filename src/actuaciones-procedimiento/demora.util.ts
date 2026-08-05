import { BadRequestException } from '@nestjs/common';

// Umbral corregido (2026-07-20): el Prompt CORE del generador de informes
// (CORE_TRANSVERSAL, numerales 14 y 17) establece "más de 5 horas" como
// el límite para exigir justificación de la demora en la puesta a
// disposición.
export const UMBRAL_DEMORA_HORAS = 5;

interface FechasProcedimiento {
  fechaCaptura: Date;
  horaCaptura: string;
  fechaDisposicion: Date | null;
  horaDisposicion: string | null;
}

export function combinarFechaHora(fecha: Date, hora: string): Date {
  const [horas, minutos] = hora.split(':').map(Number);
  const combinada = new Date(fecha);
  // Se usa setUTCHours (no setHours) porque la fecha ya viene interpretada
  // en UTC (así la almacena Postgres/Prisma); mezclar con la hora local
  // del servidor producía desfases de hasta 24 horas según la zona
  // horaria en la que corriera el proceso.
  combinada.setUTCHours(horas || 0, minutos || 0, 0, 0);
  return combinada;
}

/**
 * Adenda 2026-08-04: antes, si existía demora, se calculaba UNA VEZ al
 * guardar las Actuaciones (Bloque 5) y se persistía como una foto fija
 * (demoraExistente Boolean en la base de datos). El problema: la puesta a
 * disposición se guarda en un endpoint totalmente distinto
 * (PATCH /procedimientos/:id, desde el Bloque 5 pero en un formulario
 * separado con su propio autoguardado) que nunca recalculaba esa foto.
 * Si el usuario llenaba primero la lectura de derechos y despues editaba
 * la puesta a disposición, demoraExistente quedaba desactualizado hasta
 * la próxima vez que se tocara algo del Bloque 5.
 *
 * Ahora demoraExistente YA NO se persiste en ninguna parte: se calcula
 * aquí, en caliente, cada vez que se necesita (al leer las actuaciones
 * para el frontend, y al generar el FPJ-5) a partir de las 4 fechas/horas
 * vigentes en ese momento. Así nunca puede quedar desactualizado sin
 * importar cuál de los dos bloques se edite primero o después.
 */
export function calcularDemoraExistente(procedimiento: FechasProcedimiento): boolean {
  if (!procedimiento.fechaDisposicion || !procedimiento.horaDisposicion) {
    return false;
  }

  const momentoCaptura = combinarFechaHora(procedimiento.fechaCaptura, procedimiento.horaCaptura);
  const momentoDisposicion = combinarFechaHora(
    procedimiento.fechaDisposicion,
    procedimiento.horaDisposicion,
  );

  const horasTranscurridas =
    (momentoDisposicion.getTime() - momentoCaptura.getTime()) / (1000 * 60 * 60);
  return horasTranscurridas >= UMBRAL_DEMORA_HORAS;
}

/**
 * Valida que la puesta a disposición no sea anterior a la captura. Se usa
 * tanto al guardar Actuaciones (si ahí se edita la hora de derechos, que
 * sincroniza la captura) como al guardar la puesta a disposición del
 * procedimiento directamente — para que la regla se cumpla sin importar
 * cuál de los dos se edite primero.
 */
export function validarOrdenFechas(procedimiento: FechasProcedimiento): void {
  if (!procedimiento.fechaDisposicion || !procedimiento.horaDisposicion) return;

  const momentoCaptura = combinarFechaHora(procedimiento.fechaCaptura, procedimiento.horaCaptura);
  const momentoDisposicion = combinarFechaHora(
    procedimiento.fechaDisposicion,
    procedimiento.horaDisposicion,
  );

  if (momentoDisposicion < momentoCaptura) {
    throw new BadRequestException(
      'La fecha/hora de puesta a disposición no puede ser anterior a la de captura/aprehensión.',
    );
  }
}
