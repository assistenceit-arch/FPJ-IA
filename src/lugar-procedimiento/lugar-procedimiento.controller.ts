import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { LugarProcedimientoService } from './lugar-procedimiento.service';
import { GuardarLugarProcedimientoDto } from './dto/guardar-lugar-procedimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/lugar-procedimiento')
export class LugarProcedimientoController {
  constructor(private readonly service: LugarProcedimientoService) {}

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
    @Body() dto: GuardarLugarProcedimientoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.guardar(procedimientoId, dto, usuario.sub, usuario.correo);
  }
}
