import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ActualizarConfiguracionPagosDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valorEstandar!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valorComplejo!: number;
}
