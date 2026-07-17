import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/app.config';
import { environmentValidationSchema } from './config/environment.validation';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProcedimientosModule } from './procedimientos/procedimientos.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { FuncionarioActuanteModule } from './funcionario-actuante/funcionario-actuante.module';
import { CompaneroPatrullaModule } from './companero-patrulla/companero-patrulla.module';
import { LugarProcedimientoModule } from './lugar-procedimiento/lugar-procedimiento.module';
// NOTA (Fase 0 - corrección de arquitectura):
// FormularioMaestroModule fue retirado porque su modelo (FormularioMaestro,
// basado en columnas JSON) no correspondía al Modelo de Datos V1 documentado.
// Se está reemplazando en la Fase 1 por módulos independientes y normalizados:
// funcionario-actuante (✔), companero-patrulla (✔), lugar-procedimiento (✔),
// capturados, elementos-incautados y actuaciones-procedimiento.

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: environmentValidationSchema,
    }),
    AuthModule,
    UsuariosModule,
    PrismaModule,
    ProcedimientosModule,
    AuditoriaModule,
    FuncionarioActuanteModule,
    CompaneroPatrullaModule,
    LugarProcedimientoModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}