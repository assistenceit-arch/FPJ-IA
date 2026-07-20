import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentosService } from './documentos.service';
import { GenerarFpj5Dto } from './dto/generar-fpj5.dto';
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

  @Post('procedimientos/:procedimientoId/capturados/:capturadoId/documentos/fpj6-acta-derechos')
  generarFpj6(
    @Param('procedimientoId') procedimientoId: string,
    @Param('capturadoId') capturadoId: string,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.generarFpj6ActaDerechos(
      procedimientoId,
      capturadoId,
      usuario.sub,
      usuario.correo,
    );
  }

  // La narración de los hechos (sección 9) se genera automáticamente por
  // IA. Si falta información o hay una inconsistencia según las reglas del
  // CORE, responde 409 con la pregunta exacta (ver AclaracionRequeridaException)
  // y NO genera ningún documento. Reenviar la solicitud agregando la
  // respuesta del funcionario en `aclaraciones`.
  @Post('procedimientos/:procedimientoId/documentos/fpj5-informe-captura')
  generarFpj5(
    @Param('procedimientoId') procedimientoId: string,
    @Body() dto: GenerarFpj5Dto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.service.generarFpj5Informe(
      procedimientoId,
      usuario.sub,
      usuario.correo,
      dto.aclaraciones ?? [],
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
