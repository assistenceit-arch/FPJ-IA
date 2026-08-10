import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validarUsuario(
    correo: string,
    password: string,
  ) {
    const usuario = await this.usuariosService.buscarPorCorreo(correo);

    if (!usuario) {
      throw new UnauthorizedException(
        'Correo o contraseña incorrectos',
      );
    }

    const passwordValido = await bcrypt.compare(
      password,
      usuario.password,
    );

    if (!passwordValido) {
      throw new UnauthorizedException(
        'Correo o contraseña incorrectos',
      );
    }

    // Adenda 2026-08-06: bloqueo de acceso por uso irregular (panel de
    // administración) y verificación de correo del registro autónomo.
    // Se comprueban DESPUÉS de validar la contraseña para no revelar si
    // una cuenta existe/está bloqueada a alguien que no la conoce.
    if (usuario.eliminado) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException(
        'Tu cuenta ha sido bloqueada. Contacta a un administrador.',
      );
    }
    if (!usuario.correoVerificado) {
      throw new UnauthorizedException(
        'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
      );
    }

    return usuario;
  }

  async login(usuario: any) {
    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }
}
