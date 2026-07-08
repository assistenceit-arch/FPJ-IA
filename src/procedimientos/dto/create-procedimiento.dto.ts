import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProcedimientoDto {
  @IsOptional()
  @IsString()
  nunc?: string;

  @IsNotEmpty()
  @IsDateString()
  fechaCaptura!: Date;

  @IsNotEmpty()
  @IsString()
  horaCaptura!: string;

  @IsNotEmpty()
  @IsDateString()
  fechaDisposicion!: Date;

  @IsNotEmpty()
  @IsString()
  horaDisposicion!: string;

  @IsNotEmpty()
  @IsString()
  delito!: string;

  @IsNotEmpty()
  @IsString()
  tipoProcedimiento!: string;

  @IsNotEmpty()
  @IsString()
  estado!: string;

  @IsOptional()
  @IsString()
  observacionesGenerales?: string;
}