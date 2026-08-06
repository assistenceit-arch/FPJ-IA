import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
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
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  registrar(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: RegistrarPagoDto,
    @UploadedFile() comprobante: Express.Multer.File,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.registrar(procedimientoId, dto, comprobante, usuario.sub, usuario.correo);
  }

  @Get()
  obtener(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.obtener(procedimientoId, usuario.sub, usuario.rol);
  }

  @Get('comprobante')
  async descargarComprobante(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
    @Res() res: Response,
  ) {
    const ruta = await this.service.obtenerRutaComprobante(
      procedimientoId,
      usuario.sub,
      usuario.rol,
    );
    return res.download(ruta);
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
