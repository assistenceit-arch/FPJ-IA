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

  // Adenda 2026-08-03: @IsOptional() de class-validator solo omite la
  // validación cuando el valor es null/undefined, NO cuando es cadena
  // vacía. Como el frontend envía "" al dejar el campo en blanco (no
  // null), @IsEmail() igual se ejecutaba y rechazaba la petición con
  // "correo must be an email" — en la práctica volvía el campo
  // obligatorio pese a estar marcado como opcional. @ValidateIf hace que
  // la cadena vacía también se trate como "no aportado".
  //
  // Adenda 2026-08-06: además de vacío, se permite explícitamente la
  // leyenda "No aporta" (sin distinguir mayúsculas) sin que @IsEmail()
  // la rechace por no tener formato de correo -- el funcionario la
  // escribe cuando el interviniente no tiene o no quiere dar un correo.
  @ValidateIf(
    (o) =>
      o.correo !== undefined &&
      o.correo !== null &&
      o.correo !== '' &&
      o.correo.trim().toLowerCase() !== 'no aporta',
  )
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

  // Adenda 2026-08-03: uso de esposas pasa a ser individual por
  // interviniente (antes era una sola respuesta en Actuaciones para todo
  // el procedimiento). El frontend solo la muestra para Aprehendidos.
  @IsOptional()
  @IsBoolean()
  usoEsposas?: boolean;

  @ValidateIf((o) => o.usoEsposas === true)
  @IsString()
  justificacionEsposas?: string;

  // Adenda 2026-08-11: tiempo y motivo de retiro, junto a la
  // justificación de por qué se colocaron.
  @ValidateIf((o) => o.usoEsposas === true)
  @IsString()
  tiempoEsposado?: string;

  @ValidateIf((o) => o.usoEsposas === true)
  @IsString()
  motivoRetiroEsposas?: string;

  @IsOptional()
  @IsBoolean()
  identificacionPlena?: boolean;

  @IsOptional()
  @IsString()
  formaIdentificacion?: string;

  // Adenda 2026-08-11: lesiones pasa a ser individual por interviniente
  // (antes era una sola respuesta en Actuaciones para todo el
  // procedimiento), mismo criterio ya aplicado a esposas.
  @IsOptional()
  @IsBoolean()
  presentaLesiones?: boolean;

  @ValidateIf((o) => o.presentaLesiones === true)
  @IsString()
  descripcionLesiones?: string;

  @ValidateIf((o) => o.presentaLesiones === true)
  @IsString()
  parteCuerpoLesion?: string;

  @ValidateIf((o) => o.presentaLesiones === true)
  @IsString()
  motivoLesion?: string;

  @IsOptional()
  @IsBoolean()
  trasladoCentroAsistencial?: boolean;

  @ValidateIf((o) => o.trasladoCentroAsistencial === true)
  @IsString()
  centroAsistencial?: string;

  @ValidateIf((o) => o.trasladoCentroAsistencial === true)
  @IsString()
  motivoTraslado?: string;
}
