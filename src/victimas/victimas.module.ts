import { Module } from '@nestjs/common';
import { VictimasService } from './victimas.service';
import { VictimasController } from './victimas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [VictimasController],
  providers: [VictimasService],
})
export class VictimasModule {}
