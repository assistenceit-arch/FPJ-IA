import { Module } from '@nestjs/common';
import { FormularioMaestroService } from './formulario-maestro.service';
import { FormularioMaestroController } from './formulario-maestro.controller';

@Module({
  controllers: [FormularioMaestroController],
  providers: [FormularioMaestroService],
})
export class FormularioMaestroModule {}
