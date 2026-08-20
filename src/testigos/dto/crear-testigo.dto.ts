import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

// Adenda 2026-08-20: Testigo de los hechos (Sección 5 del FPJ 5, núcleo
// común transversal a todos los delitos). Misma dinámica de
// diligenciamiento que CrearCapturadoDto: todos los campos opcionales
// salvo el nombre, con el mismo criterio de "no aporta" para
// fecha de nacimiento / edad manual.
export class CrearTestigoDto {
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

  // Igual criterio que Capturado: viene fechaNacimiento O edadManual,
  // nunca ambos (validado en TestigosService.resolverEdad).
  @ValidateIf((o) => o.edadManual === undefined || o.edadManual === null)
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ValidateIf((o) => o.fechaNacimiento === undefined || o.fechaNacimiento === null)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  edadManual?: number;

  @IsOptional()
  @IsString()
  genero?: string;

  // Lugar de nacimiento desglosado (a diferencia de Capturado, que solo
  // tiene un campo libre) -- a solicitud del usuario.
  @IsOptional()
  @IsString()
  paisNacimiento?: string;

  @IsOptional()
  @IsString()
  departamentoNacimiento?: string;

  @IsOptional()
  @IsString()
  municipioNacimiento?: string;

  @IsOptional()
  @IsString()
  profesionOficio?: string;

  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  // Mismo criterio que CrearCapturadoDto.correo: cadena vacía o "No
  // aporta" no debe activar la validación de formato de correo.
  @ValidateIf(
    (o) =>
      o.correo !== undefined &&
      o.correo !== null &&
      o.correo !== '' &&
      o.correo.trim().toLowerCase() !== 'no aporta',
  )
  @IsEmail()
  correo?: string;
}
