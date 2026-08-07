import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { RegistrarPublicoDto } from './dto/registrar-publico.dto';
import { CorreoService } from '../correo/correo.service';
import * as bcrypt from 'bcrypt';

const HORAS_VALIDEZ_TOKEN = 24;

@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private readonly correo: CorreoService,
  ) {}

  /**
   * Creación por un administrador (panel de administración). Queda
   * verificada de inmediato -- ya hay un administrador vouching por la
   * cuenta, no necesita confirmar el correo.
   */
  async crear(createUsuarioDto: CreateUsuarioDto) {
    const existente = await this.buscarPorCorreo(createUsuarioDto.correo);
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

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
        correoVerificado: true,
      },
    });
  }

  /**
   * Adenda 2026-08-06: registro autónomo desde la pantalla de login. El
   * rol siempre queda en FUNCIONARIO (nunca se acepta del cliente) y la
   * cuenta queda inactiva para iniciar sesión hasta que se verifique el
   * correo mediante el enlace enviado.
   */
  async registrarPublico(dto: RegistrarPublicoDto) {
    const existente = await this.buscarPorCorreo(dto.correo);
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const token = crypto.randomUUID();
    const expira = new Date(Date.now() + HORAS_VALIDEZ_TOKEN * 60 * 60 * 1000);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombres: dto.nombres,
        correo: dto.correo,
        telefono: dto.telefono,
        password: passwordHash,
        rol: 'FUNCIONARIO',
        correoVerificado: false,
        tokenVerificacion: token,
        tokenVerificacionExpira: expira,
      },
    });

    await this.correo.enviarVerificacion(usuario.correo, usuario.nombres, token);

    return { correo: usuario.correo };
  }

  /**
   * Confirma el correo a partir del token enviado por email. El token
   * vence a las 24 horas (HORAS_VALIDEZ_TOKEN); pasado ese tiempo hay que
   * volver a registrarse (no hay reenvío automático por ahora).
   */
  async verificarCorreo(token: string) {
    if (!token) {
      throw new BadRequestException('Falta el token de verificación.');
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { tokenVerificacion: token } });
    if (!usuario) {
      throw new BadRequestException('El enlace de verificación no es válido.');
    }
    if (usuario.correoVerificado) {
      return { mensaje: 'Este correo ya estaba verificado.' };
    }
    if (!usuario.tokenVerificacionExpira || usuario.tokenVerificacionExpira < new Date()) {
      throw new BadRequestException(
        'El enlace de verificación venció. Vuelve a registrarte para recibir uno nuevo.',
      );
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        correoVerificado: true,
        tokenVerificacion: null,
        tokenVerificacionExpira: null,
      },
    });

    return { mensaje: 'Correo verificado correctamente.' };
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
   * Panel de administración: lista paginada de todos los usuarios del
   * sistema, para gestionar roles y bloqueo/desbloqueo de acceso.
   */
  async listarTodos(pagina = 1, porPagina = 10) {
    const [datos, total] = await Promise.all([
      this.prisma.usuario.findMany({
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          identificacion: true,
          correo: true,
          telefono: true,
          rol: true,
          activo: true,
          correoVerificado: true,
          createdAt: true,
        },
        orderBy: { nombres: 'asc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      this.prisma.usuario.count(),
    ]);

    return { datos, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
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
      await this.exigirNoEsUltimoAdministrador(id);
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

  /**
   * Bloquea o desbloquea el acceso de un usuario (uso irregular de la
   * aplicación, Adenda 2026-08-06). Misma protección que cambiarRol: no
   * se puede dejar el sistema sin ningún administrador activo.
   */
  async cambiarEstado(id: string, activo: boolean) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (usuario.rol === 'ADMINISTRADOR' && !activo) {
      await this.exigirNoEsUltimoAdministrador(id);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { activo },
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

  private async exigirNoEsUltimoAdministrador(idExcluido: string) {
    const totalAdministradores = await this.prisma.usuario.count({
      where: { rol: 'ADMINISTRADOR', activo: true, id: { not: idExcluido } },
    });
    if (totalAdministradores < 1) {
      throw new BadRequestException(
        'No se puede dejar el sistema sin ningún administrador activo.',
      );
    }
  }
}
