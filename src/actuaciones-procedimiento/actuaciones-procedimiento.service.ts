import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { GuardarActuacionesDto } from './dto/guardar-actuaciones.dto';
import { calcularDemoraExistente, validarOrdenFechas } from './demora.util';

@Injectable()
export class ActuacionesProcedimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
  ) {}

  async obtener(procedimientoId: string, usuarioId: string) {
    const procedimiento = await this.acceso.verificarPropiedad(
      procedimientoId,
      usuarioId,
    );

    const actuaciones = await this.prisma.actuacionesProcedimiento.findUnique({
      where: { procedimientoId },
    });

    if (!actuaciones) return null;

    // Adenda 2026-08-04: demoraExistente ya no se persiste — se calcula
    // aquí, en caliente, con las fechas/horas vigentes del procedimiento
    // en este momento. Ver demora.util.ts para el porqué.
    return {
      ...actuaciones,
      demoraExistente: calcularDemoraExistente(procedimiento),
    };
  }

  async guardar(
    procedimientoId: string,
    dto: GuardarActuacionesDto,
    usuarioId: string,
    correoUsuario: string,
  ) {
    const procedimiento = await this.acceso.verificarPropiedad(
      procedimientoId,
      usuarioId,
    );

    // La captura/aprehensión se materializa en el momento en que se leen
    // los derechos: la hora de captura del procedimiento se sincroniza
    // automáticamente con la hora de derechos registrada aquí. Adenda
    // 2026-08-03: si el usuario todavía no ha diligenciado fecha y hora
    // de derechos (borrador), se omite la sincronización — no bloquea el
    // guardado del resto del bloque.
    const fechaDerechos = dto.fechaDerechos ? new Date(dto.fechaDerechos) : null;
    let procedimientoVigente = procedimiento;

    if (fechaDerechos && dto.horaDerechos) {
      procedimientoVigente = await this.prisma.procedimiento.update({
        where: { id: procedimientoId },
        data: {
          fechaCaptura: fechaDerechos,
          horaCaptura: dto.horaDerechos,
        },
      });

      if (
        procedimiento.fechaCaptura.getTime() !== fechaDerechos.getTime() ||
        procedimiento.horaCaptura !== dto.horaDerechos
      ) {
        await this.auditoria.registrar({
          usuario: correoUsuario,
          accion: 'Modificar',
          tablaAfectada: 'procedimientos',
          registroAfectado: procedimientoId,
          descripcionEvento:
            'Hora de captura sincronizada automáticamente con la hora de lectura de derechos.',
        });
      }
    }

    // Valida que la puesta a disposición (si ya está diligenciada) no sea
    // anterior a la captura recién sincronizada. La demora en sí ya NO se
    // calcula ni se guarda aquí — ver obtener() y documentos.service.ts,
    // que la calculan al vuelo con demora.util.ts.
    validarOrdenFechas(procedimientoVigente);

    const existente = await this.prisma.actuacionesProcedimiento.findUnique({
      where: { procedimientoId },
    });

    // horaDerechos y autoridadReceptora son String NOT NULL en la base de
    // datos (aceptan cadena vacía, pero no "undefined"); se normalizan
    // aquí porque el dto ya las admite opcionales (borrador parcial).
    // justificacionDemora se guarda tal cual la escriba el usuario, sin
    // importar si en este momento aplica o no demora — así no se borra
    // en silencio un texto ya escrito si las fechas cambian después.
    const datos = {
      ...dto,
      fechaDerechos,
      horaDerechos: dto.horaDerechos ?? '',
      autoridadReceptora: dto.autoridadReceptora ?? '',
    };

    const resultado = await this.prisma.actuacionesProcedimiento.upsert({
      where: { procedimientoId },
      create: { ...datos, procedimientoId },
      update: datos,
    });

    await this.auditoria.registrar({
      usuario: correoUsuario,
      accion: existente ? 'Modificar' : 'Crear',
      tablaAfectada: 'actuaciones_procedimiento',
      registroAfectado: resultado.id,
      descripcionEvento: `${existente ? 'Actualización' : 'Registro'} de las actuaciones procedimentales del procedimiento ${procedimientoId}`,
    });

    return {
      ...resultado,
      demoraExistente: calcularDemoraExistente(procedimientoVigente),
    };
  }
}
