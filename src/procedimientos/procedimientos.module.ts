import { Module } from '@nestjs/common';
import { ProcedimientosService } from './procedimientos.service';
import { ProcedimientosController } from './procedimientos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [ProcedimientosController],
  providers: [ProcedimientosService],
})
export class ProcedimientosModule {}