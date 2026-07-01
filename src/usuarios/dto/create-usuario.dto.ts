import {
  IsEmail,
  IsNotEmpty,
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

  @MinLength(8)
  password!: string;

  @IsString()
  rol!: string;
}