import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GuardarLugarProcedimientoDto {
  @IsNotEmpty()
  @IsString()
  departamento!: string;

  @IsNotEmpty()
  @IsString()
  municipio!: string;

  @IsOptional()
  @IsString()
  localidad?: string;

  @IsNotEmpty()
  @IsString()
  barrio!: string;

  @IsNotEmpty()
  @IsString()
  direccion!: string;

  @IsOptional()
  @IsString()
  caracteristicas?: string;
}
