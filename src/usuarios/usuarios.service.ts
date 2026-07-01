import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async crear(createUsuarioDto: CreateUsuarioDto) {
    const passwordHash = await bcrypt.hash(
      createUsuarioDto.password,
      10,
    );

    return this.prisma.usuario.create({
      data: {
        nombres: createUsuarioDto.nombres,
        apellidos: createUsuarioDto.apellidos,
        identificacion: createUsuarioDto.identificacion,
        correo: createUsuarioDto.correo,
        password: passwordHash,
        rol: createUsuarioDto.rol,
      },
    });
  }

  async buscarPorCorreo(correo: string) {
    return this.prisma.usuario.findUnique({
      where: {
        correo,
      },
    });
  }

  async buscarPorId(id: number) {
    return this.prisma.usuario.findUnique({
      where: {
        id,
      },
    });
  }
}