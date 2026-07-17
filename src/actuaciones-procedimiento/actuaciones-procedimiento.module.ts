import { Module } from '@nestjs/common';
import { ActuacionesProcedimientoService } from './actuaciones-procedimiento.service';
import { ActuacionesProcedimientoController } from './actuaciones-procedimiento.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [ActuacionesProcedimientoController],
  providers: [ActuacionesProcedimientoService],
})
export class ActuacionesProcedimientoModule {}
