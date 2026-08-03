import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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

  // Adenda 2026-08-03: pasa a obligatorio a solicitud del usuario — es
  // requerido por los ejemplos de redacción aprobados ("CAI La Esperanza").
  @IsNotEmpty()
  @IsString()
  cai!: string;
}
