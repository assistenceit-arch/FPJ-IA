import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ActuacionesProcedimientoService } from './actuaciones-procedimiento.service';
import { GuardarActuacionesDto } from './dto/guardar-actuaciones.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/actuaciones-procedimiento')
export class ActuacionesProcedimientoController {
  constructor(private readonly service: ActuacionesProcedimientoService) {}

  @Get()
  obtener(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtener(procedimientoId, usuario.sub);
  }

  @Put()
  guardar(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: GuardarActuacionesDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.guardar(procedimientoId, dto, usuario.sub, usuario.correo);
  }
}
