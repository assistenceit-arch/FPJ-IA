import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PagosService } from './pagos.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { VerificarPagoDto } from './dto/verificar-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/pago')
export class PagosController {
  constructor(private readonly service: PagosService) {}

  @Post()
  registrar(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: RegistrarPagoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.registrar(procedimientoId, dto, usuario.sub, usuario.correo);
  }

  @Get()
  obtener(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtener(procedimientoId, usuario.sub);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR')
  @Patch('verificar')
  verificar(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: VerificarPagoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.verificar(procedimientoId, dto, usuario.sub, usuario.correo);
  }
}