import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
}