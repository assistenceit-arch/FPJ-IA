import { Module } from '@nestjs/common';
import { ConfiguracionPagosService } from './configuracion-pagos.service';
import { ConfiguracionPagosController } from './configuracion-pagos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [ConfiguracionPagosController],
  providers: [ConfiguracionPagosService],
  exports: [ConfiguracionPagosService],
})
export class ConfiguracionPagosModule {}
