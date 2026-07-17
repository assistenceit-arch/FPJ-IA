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
import { CapturadosModule } from './capturados/capturados.module';
import { ElementosIncautadosModule } from './elementos-incautados/elementos-incautados.module';
// NOTA (Fase 0 - corrección de arquitectura):
// FormularioMaestroModule fue retirado porque su modelo (FormularioMaestro,
// basado en columnas JSON) no correspondía al Modelo de Datos V1 documentado.
// Fase 1 completa: funcionario-actuante (✔), companero-patrulla (✔),
// lugar-procedimiento (✔), capturados (✔), elementos-incautados (✔).
// Pendiente: actuaciones-procedimiento (Fase 2).

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
    CapturadosModule,
    ElementosIncautadosModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}