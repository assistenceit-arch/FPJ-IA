import { IsOptional, IsString } from 'class-validator';

// Adenda 2026-08-03: todos los campos pasan a opcionales para permitir
// guardado parcial (borrador) mientras el funcionario aún no ha terminado
// de diligenciar el bloque — antes, si faltaba uno solo, el frontend no
// enviaba nada al backend y el trabajo escrito se perdía al salir o
// recargar la página sin haber completado el último campo. La
// obligatoriedad de estos campos para considerar el bloque "completo"
// ahora se controla únicamente en el frontend (ver estadoLugar en
// src/lib/estados.ts del frontend).
export class GuardarLugarProcedimientoDto {
  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  municipio?: string;

  @IsOptional()
  @IsString()
  localidad?: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  caracteristicas?: string;
}
