import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AsesoriaComplejaService } from './asesoria-compleja.service';
import { CrearAsesoriaDto } from './dto/crear-asesoria.dto';
import { ActualizarAsesoriaDto } from './dto/actualizar-asesoria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/asesoria-compleja')
export class AsesoriaComplejaController {
  constructor(private readonly service: AsesoriaComplejaService) {}

  @Post()
  crear(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: CrearAsesoriaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.crear(procedimientoId, dto, usuario.sub, usuario.correo);
  }

  @Get()
  obtener(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtener(procedimientoId, usuario.sub);
  }

  @Patch()
  actualizar(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: ActualizarAsesoriaDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.actualizar(
      procedimientoId,
      dto,
      usuario.sub,
      usuario.correo,
    );
  }
}
