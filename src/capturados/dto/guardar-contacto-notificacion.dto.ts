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
