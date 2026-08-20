import { PartialType } from '@nestjs/mapped-types';
import { CrearTestigoDto } from './crear-testigo.dto';

export class ActualizarTestigoDto extends PartialType(CrearTestigoDto) {}
