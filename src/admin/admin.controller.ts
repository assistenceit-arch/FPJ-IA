import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ProcedimientosService } from '../procedimientos/procedimientos.service';
import { PagosService } from '../pagos/pagos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ExonerarPagoDto } from './dto/exonerar-pago.dto';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

// Todas las rutas de este controlador son exclusivas de administrador —
// el guard de roles se aplica a nivel de clase, no hace falta repetirlo
// en cada método.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly procedimientosService: ProcedimientosService,
    private readonly pagosService: PagosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  // ── Procedimientos / exoneración de pago ──

  @Get('procedimientos')
  listarProcedimientos(@Query('busqueda') busqueda?: string) {
    return this.procedimientosService.listarTodosAdmin(busqueda);
  }

  @Patch('procedimientos/:id/exoneracion')
  exonerarPago(
    @Param('id') id: string,
    @Body() dto: ExonerarPagoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.procedimientosService.exonerarPago(id, dto.exonerado, usuario.correo);
  }

  // ── Pagos ──

  @Get('pagos/pendientes')
  listarPagosPendientes() {
    return this.pagosService.listarPendientesAdmin();
  }

  // ── Usuarios / roles ──

  @Get('usuarios')
  listarUsuarios() {
    return this.usuariosService.listarTodos();
  }

  @Patch('usuarios/:id/rol')
  cambiarRol(@Param('id') id: string, @Body() dto: CambiarRolDto) {
    return this.usuariosService.cambiarRol(id, dto.rol);
  }
}
