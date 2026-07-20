import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Se lanza cuando el módulo de narrativa detecta información faltante,
 * inconsistente o insuficiente para redactar la narración del FPJ-5.
 *
 * El controlador la traduce a 409 Conflict con la pregunta exacta del
 * modelo, y NO debe generarse ni guardarse ningún documento en este caso.
 * El cliente reenvía la solicitud al mismo endpoint agregando la
 * respuesta del funcionario en el arreglo `aclaraciones`.
 */
export class AclaracionRequeridaException extends HttpException {
  constructor(pregunta: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        aclaracionRequerida: true,
        pregunta,
        mensaje:
          'Se requiere una aclaración antes de generar el FPJ-5. Reenvíe la ' +
          'solicitud agregando la respuesta del funcionario en "aclaraciones".',
      },
      HttpStatus.CONFLICT,
    );
  }
}
