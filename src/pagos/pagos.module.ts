import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';
import { ConfiguracionPagosModule } from '../configuracion-pagos/configuracion-pagos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule, ConfiguracionPagosModule],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
