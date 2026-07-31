import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class GuardarActuacionesDto {
  // ── Lectura de derechos ──
  @IsNotEmpty()
  @IsBoolean()
  derechosLeidos!: boolean;

  @IsNotEmpty()
  @IsDateString()
  fechaDerechos!: string;

  @IsNotEmpty()
  @IsString()
  horaDerechos!: string; // formato 24h, ej. "14:35" (RT-004)

  @IsNotEmpty()
  @IsBoolean()
  comprendeDerechos!: boolean;

  // ── Uso de esposas ──
  @IsNotEmpty()
  @IsBoolean()
  usoEsposas!: boolean;

  @ValidateIf((o) => o.usoEsposas === true)
  @IsNotEmpty()
  @IsString()
  justificacionEsposas?: string;

  // ── Estado físico ──
  @IsNotEmpty()
  @IsBoolean()
  presentaLesiones!: boolean;

  @ValidateIf((o) => o.presentaLesiones === true)
  @IsNotEmpty()
  @IsString()
  descripcionLesiones?: string;

  // ── Atención médica ──
  @IsNotEmpty()
  @IsBoolean()
  trasladoCentroAsistencial!: boolean;

  @ValidateIf((o) => o.trasladoCentroAsistencial === true)
  @IsNotEmpty()
  @IsString()
  centroAsistencial?: string;

  @ValidateIf((o) => o.trasladoCentroAsistencial === true)
  @IsNotEmpty()
  @IsString()
  motivoTraslado?: string;

  // ── Puesta a disposición ──
  @IsNotEmpty()
  @IsString()
  autoridadReceptora!: string;

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
  @IsNotEmpty()
  @IsString()
  circunstanciaRelevante?: string;

  @IsOptional()
  @IsBoolean()
  tieneObservacionAdicional?: boolean;

  @ValidateIf((o) => o.tieneObservacionAdicional === true)
  @IsNotEmpty()
  @IsString()
  observacionAdicional?: string;
}
