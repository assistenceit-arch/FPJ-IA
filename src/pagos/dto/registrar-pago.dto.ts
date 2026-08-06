import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

// Adenda 2026-08-05: comprobantePago se quita de aquí -- ya no es texto
// libre que aporta el cliente, ahora es un archivo adjunto obligatorio
// (ver PagosController.registrar, @UploadedFile) que el servicio guarda
// en disco y cuya ruta se persiste en Pago.comprobantePago.
export class RegistrarPagoDto {
  @IsNotEmpty()
  @IsDateString()
  fechaPago!: string;

  @IsNotEmpty()
  @IsString()
  medioPago!: string;

  @IsNotEmpty()
  @IsString()
  referenciaPago!: string;
}
