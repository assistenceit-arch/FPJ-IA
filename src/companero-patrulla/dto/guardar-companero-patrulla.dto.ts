import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Modelo de Datos V1 (companero_patrulla): los 3 campos son obligatorios
// SI se registra un compañero de patrulla. El módulo completo es opcional
// (UI-015): si no hay compañero, simplemente no se llama a este endpoint.
export class GuardarCompaneroPatrullaDto {
  @IsNotEmpty()
  @IsString()
  nombreCompleto!: string;

  @IsNotEmpty()
  @IsString()
  documento!: string;

  @IsNotEmpty()
  @IsString()
  placa!: string;

  // Adenda 2026-07-25: opcional para no romper compañeros ya registrados,
  // pero necesario para individualizar correctamente en la narración
  // ("PT. Nombre Apellido, placa X" en vez de una mención genérica).
  @IsOptional()
  @IsString()
  grado?: string;
}
