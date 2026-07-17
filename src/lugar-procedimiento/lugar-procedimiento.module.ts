import { Module } from '@nestjs/common';
import { LugarProcedimientoService } from './lugar-procedimiento.service';
import { LugarProcedimientoController } from './lugar-procedimiento.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [LugarProcedimientoController],
  providers: [LugarProcedimientoService],
})
export class LugarProcedimientoModule {}
