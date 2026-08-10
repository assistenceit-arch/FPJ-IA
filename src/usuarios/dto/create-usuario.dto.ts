import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {

  @IsNotEmpty()
  @IsString()
  nombres!: string;

  @IsNotEmpty()
  @IsString()
  apellidos!: string;

  @IsNotEmpty()
  @IsString()
  identificacion!: string;

  @IsEmail()
  correo!: string;

  // Adenda 2026-08-08: faltaba por completo -- un usuario creado desde
  // el panel de administrador (a diferencia del registro autónomo) nunca
  // podía tener teléfono, así que un administrador nunca tenía forma de
  // contactarlo para un procedimiento complejo si su cuenta se creó así.
  @IsOptional()
  @IsString()
  telefono?: string;

  @MinLength(8)
  password!: string;

  @IsString()
  rol!: string;
}