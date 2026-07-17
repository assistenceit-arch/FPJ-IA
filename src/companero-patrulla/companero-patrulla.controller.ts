import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CompaneroPatrullaService } from './companero-patrulla.service';
import { GuardarCompaneroPatrullaDto } from './dto/guardar-companero-patrulla.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/companero-patrulla')
export class CompaneroPatrullaController {
  constructor(private readonly service: CompaneroPatrullaService) {}

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
    @Body() dto: GuardarCompaneroPatrullaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.guardar(procedimientoId, dto, usuario.sub, usuario.correo);
  }

  // UI-015: el compañero de patrulla es opcional; permite retirarlo si se
  // registró por error.
  @Delete()
  eliminar(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.eliminar(procedimientoId, usuario.sub, usuario.correo);
  }
}
