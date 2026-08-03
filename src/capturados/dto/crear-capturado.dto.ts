import {
  IsBoolean,
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
  // Adenda 2026-08-03: pasa a opcional — obligatoria solo si no se envía
  // edadManual (opción "No aporta"). Se valida que venga exactamente uno
  // de los dos en CapturadosService.resolverEdadYTipo.
  @ValidateIf((o) => o.edadManual === undefined || o.edadManual === null)
  @IsNotEmpty()
  @IsDateString()
  fechaNacimiento?: string;

  // Adenda 2026-08-03: edad digitada manualmente por el funcionario cuando
  // la persona no aporta su fecha de nacimiento. El criterio jurídico es
  // el mismo que con fecha de nacimiento: edadManual < 18 => Aprehendido
  // (SRPA), confirmado por el usuario. Es un campo transitorio: no se
  // persiste tal cual, se guarda en la columna "edad".
  @ValidateIf((o) => o.fechaNacimiento === undefined || o.fechaNacimiento === null)
  @IsInt()
  @Min(0)
  @Max(120)
  edadManual?: number;

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
  descripcionFisicaVestimenta?: string;

  @IsOptional()
  @IsString()
  senalesParticulares?: string;

  @IsOptional()
  @IsString()
  nombrePadres?: string;

  @IsOptional()
  @IsString()
  telefonoPadres?: string;

  @IsOptional()
  @IsString()
  escolaridad?: string;

  @IsOptional()
  @IsString()
  alias?: string;

  // ── Bloque 5/6: datos individuales para la narrativa IA (Adenda 2026-07-22) ──
  @IsOptional()
  @IsString()
  participacionHechos?: string;

  @IsOptional()
  @IsString()
  comportamientoAbordaje?: string;

  @IsOptional()
  @IsBoolean()
  identificacionPlena?: boolean;

  @IsOptional()
  @IsString()
  formaIdentificacion?: string;

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
