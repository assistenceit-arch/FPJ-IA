import { IsArray, IsOptional, IsString } from 'class-validator';

// El body del endpoint POST .../documentos/fpj5-informe-captura es opcional
// en la primera llamada. Si el módulo de narrativa responde que requiere
// aclaración (409 Conflict, ver AclaracionRequeridaException), el cliente
// reenvía la solicitud agregando la respuesta del funcionario aquí; el
// arreglo se acumula ronda tras ronda hasta que la IA tenga información
// suficiente para generar la narración.
export class GenerarFpj5Dto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aclaraciones?: string[];
}
