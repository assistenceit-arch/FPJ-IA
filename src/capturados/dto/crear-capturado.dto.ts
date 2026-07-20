import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CrearCapturadoDto {
  @IsNotEmpty()
  @IsString()
  primerNombre!: string;

  @IsOptional()
  @IsString()
  segundoNombre?: string;

  @IsNotEmpty()
  @IsString()
  primerApellido!: string;

  @IsOptional()
  @IsString()
  segundoApellido?: string;

  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @IsOptional()
  @IsString()
  expedicionDocumento?: string;

  // Base para el cálculo automático de edad y de Capturado/Aprehendido
  // (UI-017/UI-018). Nunca se acepta el tipo directamente del cliente.
  @IsNotEmpty()
  @IsDateString()
  fechaNacimiento!: string;

  @IsOptional()
  @IsString()
  lugarNacimiento?: string;

  @IsNotEmpty()
  @IsString()
  genero!: string;

  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @IsOptional()
  @IsString()
  ocupacion?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  redesSociales?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  senalesParticulares?: string;

  @IsOptional()
  @IsString()
  nombrePadres?: string;

  @IsOptional()
  @IsString()
  telefonoPadres?: string;

  // Solo aplican si, tras calcular la edad, la persona resulta menor de
  // edad (Aprehendido). Si se envían para un mayor de edad, el servicio
  // los ignora.
  @IsOptional()
  @IsString()
  nombreAcudiente?: string;

  @IsOptional()
  @IsString()
  parentescoAcudiente?: string;

  @IsOptional()
  @IsString()
  telefonoAcudiente?: string;
}
