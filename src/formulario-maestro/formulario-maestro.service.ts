import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateFormularioMaestroDto } from './dto/create-formulario-maestro.dto';
import { UpdateFormularioMaestroDto } from './dto/update-formulario-maestro.dto';

@Injectable()
export class FormularioMaestroService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(createFormularioMaestroDto: CreateFormularioMaestroDto) {
    return this.prisma.formularioMaestro.create({
      data: createFormularioMaestroDto,
    });
  }

  findAll() {
    return this.prisma.formularioMaestro.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.formularioMaestro.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: string, updateFormularioMaestroDto: UpdateFormularioMaestroDto) {
    return this.prisma.formularioMaestro.update({
      where: {
        id,
      },
      data: updateFormularioMaestroDto,
    });
  }

  remove(id: string) {
    return this.prisma.formularioMaestro.delete({
      where: {
        id,
      },
    });
  }
}