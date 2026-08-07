import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegistrarPublicoDto } from '../usuarios/dto/registrar-publico.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post('login')
  async login(
    @Body() body: {
      correo: string;
      password: string;
    },
  ) {
    const usuario = await this.authService.validarUsuario(
      body.correo,
      body.password,
    );

    return this.authService.login(usuario);
  }

  // Adenda 2026-08-06: registro autónomo desde la pantalla de login,
  // sin necesidad de que un administrador cree la cuenta.
  @Post('registro')
  async registro(@Body() dto: RegistrarPublicoDto) {
    await this.usuariosService.registrarPublico(dto);
    return {
      mensaje: 'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.',
    };
  }

  @Get('verificar-correo')
  async verificarCorreo(@Query('token') token: string) {
    return this.usuariosService.verificarCorreo(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  perfil() {
    return {
      mensaje: 'Acceso autorizado',
    };
  }
}