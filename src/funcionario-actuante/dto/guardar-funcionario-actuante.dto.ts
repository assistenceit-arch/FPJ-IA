import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GuardarFuncionarioActuanteDto {
  @IsNotEmpty()
  @IsString()
  nombreCompleto!: string;

  @IsNotEmpty()
  @IsString()
  documento!: string;

  @IsNotEmpty()
  @IsString()
  entidad!: string;

  @IsNotEmpty()
  @IsString()
  cargo!: string;

  @IsNotEmpty()
  @IsString()
  telefono!: string;

  @IsNotEmpty()
  @IsEmail()
  correo!: string;

  @IsNotEmpty()
  @IsString()
  placa!: string;

  @IsNotEmpty()
  @IsString()
  zonaAtencion!: string;

  @IsNotEmpty()
  @IsString()
  estacion!: string;

  @IsNotEmpty()
  @IsString()
  servicio!: string;

  // Adenda 2026-07-25: opcional para no romper registros existentes, pero
  // requerido por los ejemplos de redacción aprobados ("CAI La Esperanza").
  @IsOptional()
  @IsString()
  cai?: string;
}
