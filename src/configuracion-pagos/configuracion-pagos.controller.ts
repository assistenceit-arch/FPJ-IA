import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ConfiguracionPagosService } from './configuracion-pagos.service';
import { ActualizarConfiguracionPagosDto } from './dto/actualizar-configuracion-pagos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('configuracion-pagos')
export class ConfiguracionPagosController {
  constructor(private readonly service: ConfiguracionPagosService) {}

  @Get()
  obtener() {
    return this.service.obtener();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR')
  @Put()
  actualizar(
    @Body() dto: ActualizarConfiguracionPagosDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.actualizar(dto, usuario.sub, usuario.correo);
  }
}
