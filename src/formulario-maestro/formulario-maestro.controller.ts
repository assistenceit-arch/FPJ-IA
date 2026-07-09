import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FormularioMaestroService } from './formulario-maestro.service';
import { CreateFormularioMaestroDto } from './dto/create-formulario-maestro.dto';
import { UpdateFormularioMaestroDto } from './dto/update-formulario-maestro.dto';

@Controller('formulario-maestro')
export class FormularioMaestroController {
  constructor(private readonly formularioMaestroService: FormularioMaestroService) {}

  @Post()
  create(@Body() createFormularioMaestroDto: CreateFormularioMaestroDto) {
    return this.formularioMaestroService.create(createFormularioMaestroDto);
  }

  @Get()
  findAll() {
    return this.formularioMaestroService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  return this.formularioMaestroService.findOne(id);
}

  @Patch(':id')
  update(@Param('id') id: string,
  @Body() updateFormularioMaestroDto: UpdateFormularioMaestroDto
) {
   return this.formularioMaestroService.update(id, updateFormularioMaestroDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
   return this.formularioMaestroService.remove(id);
  }
}
