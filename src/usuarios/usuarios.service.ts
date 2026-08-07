import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async buscarPorId(id: string) {
    return this.prisma.usuario.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Panel de administración: lista de todos los usuarios del sistema,
   * para poder asignar/quitar el rol de administrador.
   */
  async listarTodos() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        identificacion: true,
        correo: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { nombres: 'asc' },
    });
  }

  /**
   * Adenda 2026-08-06: no se permite dejar el sistema sin ningún
   * administrador activo -- si el usuario objetivo es el único
   * ADMINISTRADOR activo y se le intenta quitar el rol, se rechaza.
   */
  async cambiarRol(id: string, nuevoRol: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (usuario.rol === 'ADMINISTRADOR' && nuevoRol !== 'ADMINISTRADOR') {
      const totalAdministradores = await this.prisma.usuario.count({
        where: { rol: 'ADMINISTRADOR', activo: true },
      });
      if (totalAdministradores <= 1) {
        throw new BadRequestException(
          'No se puede quitar el rol de administrador al único administrador activo del sistema.',
        );
      }
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { rol: nuevoRol },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        rol: true,
        activo: true,
      },
    });
  }
}
