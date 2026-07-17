import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CapturadosService } from './capturados.service';
import { CrearCapturadoDto } from './dto/crear-capturado.dto';
import { ActualizarCapturadoDto } from './dto/actualizar-capturado.dto';
import { GuardarContactoNotificacionDto } from './dto/guardar-contacto-notificacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos/:procedimientoId/capturados')
export class CapturadosController {
  constructor(private readonly service: CapturadosService) {}

  @Post()
  crear(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: CrearCapturadoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.crear(procedimientoId, dto, usuario.sub, usuario.correo);
  }

  @Get()
  listar(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.listar(procedimientoId, usuario.sub);
  }

  @Get(':capturadoId')
  obtener(
    @Param('procedimientoId') procedimientoId: string,
    @Param('capturadoId') capturadoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtener(procedimientoId, capturadoId, usuario.sub);
  }

  @Patch(':capturadoId')
  actualizar(
    @Param('procedimientoId') procedimientoId: string,
    @Param('capturadoId') capturadoId: string,
    @Body() dto: ActualizarCapturadoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.actualizar(
      procedimientoId,
      capturadoId,
      dto,
      usuario.sub,
      usuario.correo,
    );
  }

  @Delete(':capturadoId')
  eliminar(
    @Param('procedimientoId') procedimientoId: string,
    @Param('capturadoId') capturadoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.eliminar(procedimientoId, capturadoId, usuario.sub, usuario.correo);
  }

  @Get(':capturadoId/contacto-notificacion')
  obtenerContacto(
    @Param('procedimientoId') procedimientoId: string,
    @Param('capturadoId') capturadoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtenerContacto(procedimientoId, capturadoId, usuario.sub);
  }

  @Put(':capturadoId/contacto-notificacion')
  guardarContacto(
    @Param('procedimientoId') procedimientoId: string,
    @Param('capturadoId') capturadoId: string,
    @Body() dto: GuardarContactoNotificacionDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.guardarContacto(
      procedimientoId,
      capturadoId,
      dto,
      usuario.sub,
      usuario.correo,
    );
  }
}
