import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearAsesoriaDto {
  // PC-003: obligatorio.
  @IsNotEmpty()
  @IsString()
  motivoConsulta!: string;

  @IsOptional()
  @IsString()
  observacionesCaso?: string;
}
