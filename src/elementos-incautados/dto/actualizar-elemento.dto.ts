import { PartialType } from '@nestjs/mapped-types';
import { CrearElementoDto } from './crear-elemento.dto';

export class ActualizarElementoDto extends PartialType(CrearElementoDto) {}
