import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { FuncionarioActuanteService } from './funcionario-actuante.service';
import { GuardarFuncionarioActuanteDto } from './dto/guardar-funcionario-actuante.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/funcionario-actuante')
export class FuncionarioActuanteController {
  constructor(private readonly service: FuncionarioActuanteService) {}

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
    @Body() dto: GuardarFuncionarioActuanteDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.guardar(procedimientoId, dto, usuario.sub, usuario.correo);
  }
}
