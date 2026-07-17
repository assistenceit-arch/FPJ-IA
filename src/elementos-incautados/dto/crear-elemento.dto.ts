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

export const TIPOS_ELEMENTO = ['SUSTANCIA', 'DINERO', 'CELULAR', 'OTRO'] as const;
export type TipoElemento = (typeof TIPOS_ELEMENTO)[number];

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

  // ── Exclusivos de SUSTANCIA ──
  @ValidateIf((o) => o.tipoElemento === 'SUSTANCIA')
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cantidadEmpaques?: number;

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

  // ── Exclusivos de CELULAR ──
  @ValidateIf((o) => o.tipoElemento === 'CELULAR')
  @IsNotEmpty()
  @IsString()
  marca?: string;

  // IMEI: "si es visible" — opcional siempre.
  @IsOptional()
  @IsString()
  imei?: string;

  // ── Exclusivos de OTRO ──
  @ValidateIf((o) => o.tipoElemento === 'OTRO')
  @IsNotEmpty()
  @IsString()
  descripcionManual?: string;
}
