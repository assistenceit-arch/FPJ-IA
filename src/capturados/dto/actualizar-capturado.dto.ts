import { PartialType } from '@nestjs/mapped-types';
import { CrearCapturadoDto } from './crear-capturado.dto';

export class ActualizarCapturadoDto extends PartialType(CrearCapturadoDto) {}
