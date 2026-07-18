import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/roles.decorator';

/**
 * Debe usarse SIEMPRE después de JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard).
 * Si la ruta no tiene @Roles(...), deja pasar a cualquier usuario autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const rolUsuario = request.user?.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      throw new ForbiddenException(
        `Esta acción requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}.`,
      );
    }

    return true;
  }
}
