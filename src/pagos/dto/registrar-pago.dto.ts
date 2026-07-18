import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegistrarPagoDto {
  @IsNotEmpty()
  @IsDateString()
  fechaPago!: string;

  @IsNotEmpty()
  @IsString()
  medioPago!: string;

  @IsNotEmpty()
  @IsString()
  referenciaPago!: string;

  @IsOptional()
  @IsString()
  comprobantePago?: string;
}
