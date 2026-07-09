import { PartialType } from '@nestjs/mapped-types';
import { CreateFormularioMaestroDto } from './create-formulario-maestro.dto';

export class UpdateFormularioMaestroDto extends PartialType(CreateFormularioMaestroDto) {}
