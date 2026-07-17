import { Module } from '@nestjs/common';
import { CapturadosService } from './capturados.service';
import { CapturadosController } from './capturados.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [CapturadosController],
  providers: [CapturadosService],
})
export class CapturadosModule {}
