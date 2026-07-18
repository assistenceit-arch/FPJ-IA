import { Module } from '@nestjs/common';
import { AsesoriaComplejaService } from './asesoria-compleja.service';
import { AsesoriaComplejaController } from './asesoria-compleja.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [AsesoriaComplejaController],
  providers: [AsesoriaComplejaService],
})
export class AsesoriaComplejaModule {}
