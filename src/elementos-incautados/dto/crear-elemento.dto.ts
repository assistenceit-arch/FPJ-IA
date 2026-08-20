import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export const TIPOS_ELEMENTO = ['SUSTANCIA', 'DINERO', 'CELULAR', 'ARMA', 'OTRO'] as const;
export type TipoElemento = (typeof TIPOS_ELEMENTO)[number];

export const TIPOS_ARMA = ['PISTOLA', 'REVOLVER', 'ESCOPETA', 'FUSIL', 'HECHIZA'] as const;
export const ESTADOS_ARMA = ['BUEN_ESTADO', 'REGULAR_ESTADO', 'MAL_ESTADO'] as const;
export const ESTADOS_SERIAL_ARMA = [
  'LEGIBLE',
  'NO_PRESENTA',
  'BORRADO',
  'ALTERADO',
  'NO_LEGIBLE',
] as const;

export class CrearElementoDto {
  @IsIn(TIPOS_ELEMENTO)
  tipoElemento!: TipoElemento;

  // MMDD Módulo 6 / FPJ7 Sección 4: si no se suministra, el sistema
  // registrará "N/A" automáticamente.
  @IsOptional()
  @IsString()
  ubicacionHallazgo?: string;

  @IsNotEmpty()
  @IsString()
  direccionIncautacion!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // ── Exclusivos de SUSTANCIA ──
  @ValidateIf((o) => o.tipoElemento === 'SUSTANCIA')
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cantidadEmpaques?: number;

  // Adenda 2026-08-11: cómo viene empacada la sustancia (bolsas,
  // papeletas, frascos, cajas, pastillas...), a solicitud del usuario.
  @ValidateIf((o) => o.tipoElemento === 'SUSTANCIA')
  @IsNotEmpty()
  @IsString()
  tipoEmpaque?: string;

  @ValidateIf((o) => o.tipoElemento === 'SUSTANCIA')
  @IsNotEmpty()
  @IsString()
  tipoSustancia?: string;

  @ValidateIf((o) => o.tipoElemento === 'SUSTANCIA' || o.tipoElemento === 'CELULAR')
  @IsNotEmpty()
  @IsString()
  color?: string;

  @ValidateIf((o) => o.tipoElemento === 'SUSTANCIA')
  @IsNotEmpty()
  @IsString()
  caracteristicas?: string;

  // ── Exclusivos de DINERO ──
  @ValidateIf((o) => o.tipoElemento === 'DINERO')
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valorTotal?: number;

  @ValidateIf((o) => o.tipoElemento === 'DINERO')
  @IsNotEmpty()
  @IsString()
  denominaciones?: string;

  // ── Exclusivos de CELULAR (marca también aplica, opcional, a ARMA) ──
  @ValidateIf((o) => o.tipoElemento === 'CELULAR')
  @IsNotEmpty()
  @IsString()
  marca?: string;

  // IMEI: "si es visible" — opcional siempre.
  @IsOptional()
  @IsString()
  imei?: string;

  // ── Exclusivos de ARMA (Adenda 2026-08-12, ajustada 2026-08-13) ──
  // Alcance confirmado: solo armas de fuego (pistola, revólver,
  // escopeta, fusil) y hechizas/artesanales, con su munición.
  @ValidateIf((o) => o.tipoElemento === 'ARMA')
  @IsIn(TIPOS_ARMA)
  tipoArma?: string;

  // Adenda 2026-08-20: "modelo" se elimina -- a solicitud del usuario,
  // no se utiliza operativamente en campo.
  @IsOptional()
  @IsString()
  calibre?: string;

  // Cacha/empuñadura: material (madera, plástica, etc.) y color.
  @IsOptional()
  @IsString()
  cachaMaterial?: string;

  @IsOptional()
  @IsString()
  cachaColor?: string;

  // El serial borrado/alterado es legalmente relevante -- se deja como
  // verificación siempre explícita, no opcional. `serial` solo aplica
  // (y solo tiene sentido) cuando estadoSerial === 'LEGIBLE'.
  @IsOptional()
  @IsString()
  serial?: string;

  @ValidateIf((o) => o.tipoElemento === 'ARMA')
  @IsIn(ESTADOS_SERIAL_ARMA)
  estadoSerial?: string;

  // 3 opciones (a solicitud del usuario, no es texto libre).
  @ValidateIf((o) => o.tipoElemento === 'ARMA')
  @IsIn(ESTADOS_ARMA)
  estadoArma?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cantidadMuniciones?: number;

  // Calibre de la MUNICIÓN, preguntado de forma independiente -- nunca
  // se asume igual al calibre del arma.
  @IsOptional()
  @IsString()
  calibreMunicion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cantidadCargadores?: number;

  // ── Exclusivos de OTRO ──
  @ValidateIf((o) => o.tipoElemento === 'OTRO')
  @IsNotEmpty()
  @IsString()
  descripcionManual?: string;
}
