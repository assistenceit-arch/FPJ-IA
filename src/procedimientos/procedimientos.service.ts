import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateProcedimientoDto } from './dto/create-procedimiento.dto';
import { UpdateProcedimientoDto } from './dto/update-procedimiento.dto';

@Injectable()
export class ProcedimientosService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(createProcedimientoDto: CreateProcedimientoDto) {
  return this.prisma.procedimiento.create({
    data: createProcedimientoDto,
  });
}

 findAll() {
  return this.prisma.procedimiento.findMany({
    orderBy: {
      fechaCreacion: 'desc',
    },
  });
}

findOne(id: string) {
  return this.prisma.procedimiento.findUnique({
    where: {
      id,
    },
  });
}

  update(id: number, updateProcedimientoDto: UpdateProcedimientoDto) {
    return `This action updates a #${id} procedimiento`;
  }

  remove(id: number) {
    return `This action removes a #${id} procedimiento`;
  }
}