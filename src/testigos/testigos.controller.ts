import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TestigosService } from './testigos.service';
import { CrearTestigoDto } from './dto/crear-testigo.dto';
import { ActualizarTestigoDto } from './dto/actualizar-testigo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/testigos')
export class TestigosController {
  constructor(private readonly service: TestigosService) {}

  @Post()
  crear(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: CrearTestigoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.crear(procedimientoId, dto, usuario.sub, usuario.correo, usuario.rol);
  }

  @Get()
  listar(@Param('procedimientoId') procedimientoId: string, @CurrentUser() usuario: JwtPayload) {
    return this.service.listar(procedimientoId, usuario.sub, usuario.rol);
  }

  @Get(':testigoId')
  obtener(
    @Param('procedimientoId') procedimientoId: string,
    @Param('testigoId') testigoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtener(procedimientoId, testigoId, usuario.sub, usuario.rol);
  }

  @Patch(':testigoId')
  actualizar(
    @Param('procedimientoId') procedimientoId: string,
    @Param('testigoId') testigoId: string,
    @Body() dto: ActualizarTestigoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.actualizar(
      procedimientoId,
      testigoId,
      dto,
      usuario.sub,
      usuario.correo,
      usuario.rol,
    );
  }

  @Delete(':testigoId')
  eliminar(
    @Param('procedimientoId') procedimientoId: string,
    @Param('testigoId') testigoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.eliminar(procedimientoId, testigoId, usuario.sub, usuario.correo, usuario.rol);
  }
}
