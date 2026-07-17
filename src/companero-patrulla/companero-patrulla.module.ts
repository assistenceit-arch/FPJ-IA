import { Module } from '@nestjs/common';
import { CompaneroPatrullaService } from './companero-patrulla.service';
import { CompaneroPatrullaController } from './companero-patrulla.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { ProcedimientosModule } from '../procedimientos/procedimientos.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, ProcedimientosModule],
  controllers: [CompaneroPatrullaController],
  providers: [CompaneroPatrullaService],
})
export class CompaneroPatrullaModule {}
