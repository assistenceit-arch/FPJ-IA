import { IsEmail, IsOptional, IsString, ValidateIf } from 'class-validator';

// Adenda 2026-08-03: todos los campos pasan a opcionales para permitir
// guardado parcial (borrador) mientras el funcionario aún no ha terminado
// de diligenciar el bloque — antes, si faltaba uno solo, el frontend no
// enviaba nada al backend y el trabajo escrito se perdía al salir o
// recargar la página sin haber completado el último campo. La
// obligatoriedad de estos campos (incluidos correo y CAI) para
// considerar el bloque "completo" ahora se controla únicamente en el
// frontend (ver estadoFuncionario en src/lib/estados.ts del frontend).
export class GuardarFuncionarioActuanteDto {
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  entidad?: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  // @IsOptional() por sí solo no trata la cadena vacía ('') igual que
  // null/undefined (ver adenda del mismo tipo en crear-capturado.dto.ts),
  // así que se usa @ValidateIf para que el borrador con correo vacío no
  // sea rechazado por @IsEmail().
  @ValidateIf((o) => o.correo !== undefined && o.correo !== null && o.correo !== '')
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @IsString()
  zonaAtencion?: string;

  @IsOptional()
  @IsString()
  estacion?: string;

  @IsOptional()
  @IsString()
  servicio?: string;

  @IsOptional()
  @IsString()
  cai?: string;
}
