import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ProcedimientoAccesoService } from '../procedimientos/procedimiento-acceso.service';
import { GuardarActuacionesDto } from './dto/guardar-actuaciones.dto';

// Umbral corregido (2026-07-20): el Prompt CORE del generador de informes
// (CORE_TRANSVERSAL, numerales 14 y 17) establece "más de 5 horas" como
// el límite para exigir justificación de la demora en la puesta a
// disposición. En la Fase 1 se había implementado erróneamente con 4h;
// se corrige aquí a 5h para mantener consistencia con la narrativa
// generada por IA.
const UMBRAL_DEMORA_HORAS = 5;

@Injectable()
export class ActuacionesProcedimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly acceso: ProcedimientoAccesoService,
  ) {}

  async obtener(procedimientoId: string, usuarioId: string) {
    await this.acceso.verificarPropiedad(procedimientoId, usuarioId);

    return this.prisma.actuacionesProcedimiento.findUnique({
      where: { procedimientoId },
    });
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
    // automáticamente con la hora de derechos registrada aquí.
    const fechaDerechos = new Date(dto.fechaDerechos);
    const procedimientoSincronizado = await this.prisma.procedimiento.update({
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

    const { demoraExistente, justificacionDemora } = this.calcularDemora(
      procedimientoSincronizado,
      dto,
    );

    const existente = await this.prisma.actuacionesProcedimiento.findUnique({
      where: { procedimientoId },
    });

    const datos = { ...dto, fechaDerechos, demoraExistente, justificacionDemora };

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

    return resultado;
  }

  /**
   * Calcula automáticamente si hubo demora en la puesta a disposición,
   * comparando la hora de captura (ya sincronizada con la de derechos) y
   * la hora de puesta a disposición del procedimiento. Umbral: 5 horas.
   */
  private calcularDemora(
    procedimiento: {
      fechaCaptura: Date;
      horaCaptura: string;
      fechaDisposicion: Date;
      horaDisposicion: string;
    },
    dto: GuardarActuacionesDto,
  ) {
    const momentoCaptura = this.combinarFechaHora(
      procedimiento.fechaCaptura,
      procedimiento.horaCaptura,
    );
    const momentoDisposicion = this.combinarFechaHora(
      procedimiento.fechaDisposicion,
      procedimiento.horaDisposicion,
    );

    if (momentoDisposicion < momentoCaptura) {
      throw new BadRequestException(
        'La fecha/hora de puesta a disposición no puede ser anterior a la de captura/aprehensión.',
      );
    }

    const horasTranscurridas =
      (momentoDisposicion.getTime() - momentoCaptura.getTime()) / (1000 * 60 * 60);
    const demoraExistente = horasTranscurridas >= UMBRAL_DEMORA_HORAS;

    if (demoraExistente && !dto.justificacionDemora?.trim()) {
      throw new BadRequestException(
        `Han transcurrido ${horasTranscurridas.toFixed(1)} horas entre la captura y la puesta a disposición (umbral: ${UMBRAL_DEMORA_HORAS}h). Debe registrar la justificación de la demora.`,
      );
    }

    return {
      demoraExistente,
      justificacionDemora: demoraExistente ? dto.justificacionDemora : null,
    };
  }

  private combinarFechaHora(fecha: Date, hora: string): Date {
    const [horas, minutos] = hora.split(':').map(Number);
    const combinada = new Date(fecha);
    // Se usa setUTCHours (no setHours) porque la fecha ya viene interpretada
    // en UTC (así la almacena Postgres/Prisma); mezclar con la hora local
    // del servidor producía desfases de hasta 24 horas según la zona
    // horaria en la que corriera el proceso.
    combinada.setUTCHours(horas || 0, minutos || 0, 0, 0);
    return combinada;
  }
}