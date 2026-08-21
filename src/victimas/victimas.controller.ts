import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { VictimasService } from './victimas.service';
import { CrearVictimaDto } from './dto/crear-victima.dto';
import { ActualizarVictimaDto } from './dto/actualizar-victima.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/victimas')
export class VictimasController {
  constructor(private readonly service: VictimasService) {}

  @Post()
  crear(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: CrearVictimaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.crear(procedimientoId, dto, usuario.sub, usuario.correo, usuario.rol);
  }

  @Get()
  listar(@Param('procedimientoId') procedimientoId: string, @CurrentUser() usuario: JwtPayload) {
    return this.service.listar(procedimientoId, usuario.sub, usuario.rol);
  }

  @Get(':victimaId')
  obtener(
    @Param('procedimientoId') procedimientoId: string,
    @Param('victimaId') victimaId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtener(procedimientoId, victimaId, usuario.sub, usuario.rol);
  }

  @Patch(':victimaId')
  actualizar(
    @Param('procedimientoId') procedimientoId: string,
    @Param('victimaId') victimaId: string,
    @Body() dto: ActualizarVictimaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.actualizar(
      procedimientoId,
      victimaId,
      dto,
      usuario.sub,
      usuario.correo,
      usuario.rol,
    );
  }

  @Delete(':victimaId')
  eliminar(
    @Param('procedimientoId') procedimientoId: string,
    @Param('victimaId') victimaId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.eliminar(procedimientoId, victimaId, usuario.sub, usuario.correo, usuario.rol);
  }
}
