import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ProcedimientosService } from '../procedimientos/procedimientos.service';
import { PagosService } from '../pagos/pagos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ExonerarPagoDto } from './dto/exonerar-pago.dto';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
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
  listarProcedimientos(
    @Query('busqueda') busqueda?: string,
    @Query('pagina') pagina?: string,
  ) {
    return this.procedimientosService.listarTodosAdmin(busqueda, Number(pagina) || 1, 10);
  }

  @Patch('procedimientos/:id/exoneracion')
  exonerarPago(
    @Param('id') id: string,
    @Body() dto: ExonerarPagoDto,
    @CurrentUser() usuario: JwtPayload,
  ) {
    return this.procedimientosService.exonerarPago(id, dto.exonerado, usuario.correo);
  }

  // RT-006/RI-005: eliminación lógica; el servicio ya rechaza si el
  // procedimiento tiene documentos generados.
  @Delete('procedimientos/:id')
  eliminarProcedimiento(@Param('id') id: string, @CurrentUser() usuario: JwtPayload) {
    return this.procedimientosService.remove(id, usuario.sub, usuario.correo, usuario.rol);
  }

  // ── Pagos ──

  @Get('pagos/pendientes')
  listarPagosPendientes() {
    return this.pagosService.listarPendientesAdmin();
  }

  // ── Usuarios / roles / bloqueo ──

  @Get('usuarios')
  listarUsuarios(@Query('pagina') pagina?: string) {
    return this.usuariosService.listarTodos(Number(pagina) || 1, 10);
  }

  @Patch('usuarios/:id/rol')
  cambiarRol(@Param('id') id: string, @Body() dto: CambiarRolDto) {
    return this.usuariosService.cambiarRol(id, dto.rol);
  }

  @Patch('usuarios/:id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    return this.usuariosService.cambiarEstado(id, dto.activo);
  }

  // RT-006/AT-005: eliminación lógica; el servicio ya protege que no
  // quede el sistema sin ningún administrador activo.
  @Delete('usuarios/:id')
  eliminarUsuario(@Param('id') id: string) {
    return this.usuariosService.eliminar(id);
  }
}
