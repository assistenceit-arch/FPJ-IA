import { Module } from '@nestjs/common';
import { TestigosService } from './testigos.service';
import { TestigosController } from './testigos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [TestigosController],
  providers: [TestigosService],
})
export class TestigosModule {}
