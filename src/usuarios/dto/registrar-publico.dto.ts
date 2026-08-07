import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Adenda 2026-08-06: registro autónomo desde la pantalla de login. A
// diferencia de CreateUsuarioDto (creación por un administrador), NO
// pide apellidos ni identificación, y NUNCA acepta un rol del cliente
// -- el rol siempre queda en FUNCIONARIO (ver UsuariosService.registrarPublico).
export class RegistrarPublicoDto {
  @IsNotEmpty()
  @IsString()
  nombres!: string;

  @IsEmail()
  correo!: string;

  @IsNotEmpty()
  @IsString()
  telefono!: string;

  @MinLength(8)
  password!: string;
}
