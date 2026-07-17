import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProcedimientosService } from './procedimientos.service';
import { CreateProcedimientoDto } from './dto/create-procedimiento.dto';
import { UpdateProcedimientoDto } from './dto/update-procedimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('procedimientos')
export class ProcedimientosController {
  constructor(private readonly procedimientosService: ProcedimientosService) {}

  @Post()
  create(
    @Body() createProcedimientoDto: CreateProcedimientoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.procedimientosService.create(
      createProcedimientoDto,
      usuario.sub,
      usuario.correo,
    );
  }

  @Get()
  findAll(@CurrentUser() usuario: JwtPayload) {
    return this.procedimientosService.findAll(usuario.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() usuario: JwtPayload) {
    return this.procedimientosService.findOne(id, usuario.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProcedimientoDto: UpdateProcedimientoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.procedimientosService.update(
      id,
      updateProcedimientoDto,
      usuario.sub,
      usuario.correo,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() usuario: JwtPayload) {
    return this.procedimientosService.remove(id, usuario.sub, usuario.correo);
  }
}
