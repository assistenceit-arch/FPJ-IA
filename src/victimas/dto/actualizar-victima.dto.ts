import { PartialType } from '@nestjs/mapped-types';
import { CrearVictimaDto } from './crear-victima.dto';

export class ActualizarVictimaDto extends PartialType(CrearVictimaDto) {}
