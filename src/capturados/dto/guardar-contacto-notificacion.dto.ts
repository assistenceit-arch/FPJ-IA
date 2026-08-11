import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class GuardarContactoNotificacionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  // Adenda 2026-08-11: faltaba -- a solicitud del usuario, junto con
  // nombre/teléfono. identificacion se conserva (la usa el FPJ-6).
  @IsOptional()
  @IsString()
  parentesco?: string;

  @IsOptional()
  @IsString()
  identificacion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty()
  @IsBoolean()
  comunicacionExitosa!: boolean;

  @IsOptional()
  @IsString()
  horaComunicacion?: string;

  // Solo es obligatoria cuando la comunicación NO fue exitosa (la
  // documentación marca este campo "obligatorio" a nivel de tabla, pero
  // su descripción — "justificación de no comunicación" — solo tiene
  // sentido en ese caso).
  @ValidateIf((o) => o.comunicacionExitosa === false)
  @IsNotEmpty()
  @IsString()
  justificacionNoComunicacion?: string;
}
