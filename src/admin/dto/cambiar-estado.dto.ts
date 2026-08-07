import { IsBoolean } from 'class-validator';

// Adenda 2026-08-06: bloqueo/desbloqueo de acceso por uso irregular de
// la aplicación, controlado por un administrador desde el panel.
export class CambiarEstadoDto {
  @IsBoolean()
  activo!: boolean;
}
