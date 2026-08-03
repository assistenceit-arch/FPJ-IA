import { IsOptional, IsString } from 'class-validator';

// Modelo de Datos V1 (companero_patrulla): el módulo completo es opcional
// (UI-015); si no hay compañero, simplemente no se llama a este endpoint.
// Adenda 2026-08-03: nombreCompleto/documento/placa pasan de obligatorios
// a opcionales para permitir guardado parcial (borrador) — antes, si
// faltaba uno solo, el frontend no enviaba nada y el trabajo escrito se
// perdía al salir o recargar sin haber completado el último campo. La
// obligatoriedad para considerar el bloque "completo" se controla en el
// frontend.
export class GuardarCompaneroPatrullaDto {
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  placa?: string;

  // Adenda 2026-07-25: opcional para no romper compañeros ya registrados,
  // pero necesario para individualizar correctamente en la narración
  // ("PT. Nombre Apellido, placa X" en vez de una mención genérica).
  @IsOptional()
  @IsString()
  grado?: string;
}
