import { Module } from '@nestjs/common';
import { ElementosIncautadosService } from './elementos-incautados.service';
import { ElementosIncautadosController } from './elementos-incautados.controller';
import { ElementosColectivosController } from './elementos-colectivos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [ElementosIncautadosController, ElementosColectivosController],
  providers: [ElementosIncautadosService],
})
export class ElementosIncautadosModule {}
