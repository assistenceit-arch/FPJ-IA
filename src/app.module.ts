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
import { ActuacionesProcedimientoModule } from './actuaciones-procedimiento/actuaciones-procedimiento.module';
import { AsesoriaComplejaModule } from './asesoria-compleja/asesoria-compleja.module';
import { ConfiguracionPagosModule } from './configuracion-pagos/configuracion-pagos.module';
import { PagosModule } from './pagos/pagos.module';
// Fase 1 completa: funcionario-actuante, companero-patrulla,
// lugar-procedimiento, capturados, elementos-incautados,
// actuaciones-procedimiento (todos ✔).
// Fase 2 completa: asesoria-compleja (✔ ticket + motivo de consulta).
// Fase 3 en curso: configuracion-pagos + pagos (✔ valor calculado
// automáticamente, sin panel de administración todavía — la configuración
// se actualiza vía API por un usuario con rol ADMINISTRADOR).

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
    ActuacionesProcedimientoModule,
    AsesoriaComplejaModule,
    ConfiguracionPagosModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}