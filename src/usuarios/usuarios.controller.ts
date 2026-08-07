import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Adenda 2026-08-06: antes este endpoint era público (sin ningún guard),
// lo que permitía crear una cuenta con rol ADMINISTRADOR sin
// autenticación alguna -- un vacío de seguridad serio dado que ahora
// existe un panel de administración protegido por rol. Crear usuarios
// nuevos pasa a ser una acción exclusiva de administradores, coherente
// con "asignar el rol de administrador a otras personas" del panel.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post()
  async crear(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ) {
    return this.usuariosService.crear(createUsuarioDto);
  }
}