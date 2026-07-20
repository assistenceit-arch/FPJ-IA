import { Module } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';
import { NarrativaModule } from '../narrativa/narrativa.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule, NarrativaModule],
  controllers: [DocumentosController],
  providers: [DocumentosService],
})
export class DocumentosModule {}
