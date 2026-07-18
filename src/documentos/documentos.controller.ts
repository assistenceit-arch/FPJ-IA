import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Post('procedimientos/:procedimientoId/capturados/:capturadoId/documentos/acta-incautacion')
  generarActaIncautacion(
    @Param('procedimientoId') procedimientoId: string,
    @Param('capturadoId') capturadoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.generarActaIncautacion(
      procedimientoId,
      capturadoId,
      usuario.sub,
      usuario.correo,
    );
  }

  @Get('procedimientos/:procedimientoId/documentos')
  listar(
    @Param('procedimientoId') procedimientoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.listar(procedimientoId, usuario.sub);
  }

  @Get('documentos/:documentoId/descargar')
  async descargar(
    @Param('documentoId') documentoId: string,
    @CurrentUser() usuario: JwtPayload,
    @Res() res: Response,
  ) {
    const documento = await this.service.obtenerArchivo(documentoId, usuario.sub);
    return res.download(documento.rutaArchivo);
  }
}
