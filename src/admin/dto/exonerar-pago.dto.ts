import { IsBoolean } from 'class-validator';

// Adenda 2026-08-06: exoneracion simple, sin motivo obligatorio (decisión
// del usuario) -- queda registrada en auditoría igual, solo que sin texto
// libre requerido.
export class ExonerarPagoDto {
  @IsBoolean()
  exonerado!: boolean;
}
