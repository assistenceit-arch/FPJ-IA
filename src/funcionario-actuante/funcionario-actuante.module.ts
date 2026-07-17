import { Module } from '@nestjs/common';
import { FuncionarioActuanteService } from './funcionario-actuante.service';
import { FuncionarioActuanteController } from './funcionario-actuante.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [FuncionarioActuanteController],
  providers: [FuncionarioActuanteService],
})
export class FuncionarioActuanteModule {}
