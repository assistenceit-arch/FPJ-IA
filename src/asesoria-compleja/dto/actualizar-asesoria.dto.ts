import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const ESTADOS_ASESORIA = ['Pendiente', 'En Proceso', 'Finalizada'] as const;

export class ActualizarAsesoriaDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @IsString()
  observacionesCaso?: string;

  @IsOptional()
  @IsIn(ESTADOS_ASESORIA)
  estadoAsesoria?: (typeof ESTADOS_ASESORIA)[number];
}
