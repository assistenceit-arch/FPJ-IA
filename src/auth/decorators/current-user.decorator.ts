import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string; // usuarioId (UUID)
  correo: string;
  rol: string;
}

/**
 * Extrae el usuario autenticado (payload del JWT) del request.
 * Requiere que el controlador/ruta esté protegido con @UseGuards(JwtAuthGuard).
 *
 * Uso: crear(@CurrentUser() usuario: JwtPayload) { ... usuario.sub ... }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
