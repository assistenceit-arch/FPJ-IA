import { Body, Controller, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

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