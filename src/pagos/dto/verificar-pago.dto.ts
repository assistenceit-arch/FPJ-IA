import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const ESTADOS_VERIFICACION = ['Verificado', 'Rechazado'] as const;

export class VerificarPagoDto {
  @IsNotEmpty()
  @IsIn(ESTADOS_VERIFICACION)
  estadoPago!: (typeof ESTADOS_VERIFICACION)[number];

  @IsOptional()
  @IsString()
  observacion?: string;
}
