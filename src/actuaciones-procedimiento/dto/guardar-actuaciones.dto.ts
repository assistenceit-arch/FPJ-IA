import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

// Adenda 2026-08-03: fechaDerechos, horaDerechos y autoridadReceptora
// pasan de obligatorios a opcionales, igual que los campos condicionales
// (descripcionLesiones, centroAsistencial, motivoTraslado,
// circunstanciaRelevante, observacionAdicional), para permitir guardado
// parcial (borrador). Antes, mientras faltara CUALQUIERA de estos, el
// backend rechazaba TODO el objeto — incluyendo campos sin relación como
// el relato del Bloque 6, que comparte este mismo registro. La
// obligatoriedad para considerar el bloque "completo" ahora se controla
// únicamente en el frontend (ver estadoActuaciones/estadoRelato en
// src/lib/estados.ts del frontend).
//
// usoEsposas/justificacionEsposas se removieron de este DTO por completo
// el mismo día: pasaron a ser una pregunta individual por interviniente
// (ver CrearCapturadoDto), no una respuesta general del procedimiento.
export class GuardarActuacionesDto {
  // ── Lectura de derechos ──
  @IsNotEmpty()
  @IsBoolean()
  derechosLeidos!: boolean;

  @ValidateIf((o) => o.fechaDerechos !== undefined && o.fechaDerechos !== null && o.fechaDerechos !== '')
  @IsDateString()
  fechaDerechos?: string;

  @IsOptional()
  @IsString()
  horaDerechos?: string; // formato 24h, ej. "14:35" (RT-004)

  @IsNotEmpty()
  @IsBoolean()
  comprendeDerechos!: boolean;

  // Adenda 2026-08-03: usoEsposas/justificacionEsposas se quitan de aquí
  // — pasan a ser una pregunta individual por interviniente en
  // CrearCapturadoDto/ActualizarCapturadoDto (ver ese archivo).

  // ── Estado físico ──
  @IsNotEmpty()
  @IsBoolean()
  presentaLesiones!: boolean;

  @ValidateIf((o) => o.presentaLesiones === true)
  @IsString()
  descripcionLesiones?: string;

  // ── Atención médica ──
  @IsNotEmpty()
  @IsBoolean()
  trasladoCentroAsistencial!: boolean;

  @ValidateIf((o) => o.trasladoCentroAsistencial === true)
  @IsString()
  centroAsistencial?: string;

  @ValidateIf((o) => o.trasladoCentroAsistencial === true)
  @IsString()
  motivoTraslado?: string;

  // ── Puesta a disposición ──
  @IsOptional()
  @IsString()
  autoridadReceptora?: string;

  // demoraExistente YA NO se recibe del cliente: el sistema lo calcula
  // automáticamente comparando la hora de captura (sincronizada con la
  // hora de derechos) y la hora de puesta a disposición del procedimiento,
  // usando el umbral de 5 horas definido por el CORE_TRANSVERSAL.
  @IsOptional()
  @IsString()
  justificacionDemora?: string;

  // ── Bloque 5/6: Relato de los hechos (Adenda 2026-07-22) ──
  // Alimentan directamente el contexto de la narrativa IA, reduciendo la
  // dependencia del ciclo de aclaraciones.
  @IsOptional()
  @IsString()
  observacionInicial?: string;

  @IsOptional()
  @IsString()
  desarrolloIntervencion?: string;

  @IsOptional()
  @IsBoolean()
  tieneCircunstanciaRelevante?: boolean;

  @ValidateIf((o) => o.tieneCircunstanciaRelevante === true)
  @IsString()
  circunstanciaRelevante?: string;

  @IsOptional()
  @IsBoolean()
  tieneObservacionAdicional?: boolean;

  @ValidateIf((o) => o.tieneObservacionAdicional === true)
  @IsString()
  observacionAdicional?: string;
}
