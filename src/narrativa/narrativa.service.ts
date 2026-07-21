import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import {
  ContextoNarracionFpj5,
  ResultadoNarracion,
} from './interfaces/contexto-narracion.interface';

const CARPETA_PROMPTS = path.join(process.cwd(), 'assets', 'prompts');
const MARCADOR_ACLARACION = 'ACLARACION_NECESARIA:';

/**
 * Genera la narración automática de los hechos del FPJ-5 (sección 9),
 * replicando el "Prompt CORE" del proyecto GENERADOR-INFORMES del usuario.
 *
 * La narración NO se guarda como campo editable en la base de datos: se
 * inserta directamente en el documento generado y el funcionario la
 * revisa/corrige en Word antes de imprimir (decisión de la sesión del
 * 2026-07-20, ver RESUMEN_TECNICO_FPJ_IA.md punto 13).
 */
@Injectable()
export class NarrativaService {
  private readonly logger = new Logger(NarrativaService.name);
  private readonly cliente: Anthropic;
  private readonly modelo: string;
  private readonly systemPrompt: string;

  constructor(private readonly config: ConfigService) {
    this.cliente = new Anthropic({
      apiKey: this.config.get<string>('anthropicApiKey'),
    });
    this.modelo = this.config.get<string>('anthropicModel') ?? 'claude-sonnet-5';
    this.systemPrompt = this.construirSystemPrompt();
  }

  async generarNarracion(
    contexto: ContextoNarracionFpj5,
    aclaraciones: string[] = [],
  ): Promise<ResultadoNarracion> {
    const mensajeUsuario = this.construirMensajeUsuario(contexto, aclaraciones);

    const respuesta = await this.cliente.messages.create({
      model: this.modelo,
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: [{ role: 'user', content: mensajeUsuario }],
    });

    const texto = respuesta.content
      .map((bloque) => (bloque.type === 'text' ? bloque.text : ''))
      .join('\n')
      .trim();

    if (texto.startsWith(MARCADOR_ACLARACION)) {
      const pregunta = texto.slice(MARCADOR_ACLARACION.length).trim();
      this.logger.log('El modelo solicitó aclaración antes de generar la narración.');
      return { tipo: 'aclaracion_requerida', pregunta };
    }

    if (!texto) {
      // Nunca debe generarse un FPJ-5 con la sección 9 en blanco: si la
      // respuesta del modelo llega vacía (por ejemplo, por corte de
      // max_tokens u otra falla de la API), es preferible fallar aquí con
      // un error explícito que silenciosamente producir un documento
      // incompleto. Ver bug reportado 2026-07-21.
      this.logger.error(
        `La API de Anthropic devolvió una respuesta vacía. stop_reason=${respuesta.stop_reason}`,
      );
      throw new Error(
        'El modelo de IA devolvió una respuesta vacía al generar la narración. ' +
          'Intente de nuevo; si el problema persiste, puede deberse a un límite ' +
          `de tokens alcanzado (stop_reason: ${respuesta.stop_reason}).`,
      );
    }

    return { tipo: 'narracion', texto };
  }

  /**
   * Arma el system prompt uniendo el CORE TRANSVERSAL (reglas universales
   * a todos los delitos) con las reglas propias de Estupefacientes (prompt
   * especializado, validaciones y flujo operativo), más una capa técnica
   * que obliga al modelo a responder en uno de dos formatos exactos y
   * parseables por código, sin depender de interpretación humana.
   */
  private construirSystemPrompt(): string {
    const leer = (nombre: string) =>
      fs.readFileSync(path.join(CARPETA_PROMPTS, nombre), 'utf8');

    const core = leer('core-transversal.md');
    const especializado = leer('estupefacientes-prompt-especializado.md');
    const validaciones = leer('estupefacientes-validaciones.md');
    const flujo = leer('estupefacientes-flujo-operativo.md');

    const capaRedaccion = `
INSTRUCCIONES ADICIONALES DE REDACCIÓN
(aplican siempre, prevalecen sobre cualquier tendencia a generalizar o
resumir cuando hay más de un interviniente)

- Cuando haya más de un interviniente, NUNCA sumes ni generalices los
  elementos hallados entre ellos. Especifica individualmente, por
  nombre, qué elemento(s) se le halló a cada persona. Si el listado de
  elementos no distingue a quién corresponde cada uno, trátalo como un
  vacío crítico y solicita aclaración en vez de asumir una distribución.
- Al narrar la puesta a disposición, indica explícitamente ante qué
  autoridad queda cada interviniente (pueden ser autoridades distintas:
  por ejemplo Fiscalía para el mayor de edad y el CESPA u otra autoridad
  del Sistema de Responsabilidad Penal para Adolescentes para el
  adolescente), y aclara que los elementos hallados a esa persona quedan
  a disposición de esa misma autoridad junto con ella.
- Los datos del funcionario actuante (placa, estación, entidad, unidad)
  se mencionan ÚNICAMENTE en el fragmento que describe quién realizó el
  procedimiento (el inicio de la narración). No los repitas ni los
  insertes sueltos en otras partes del relato.
`.trim();

    const capaTecnica = `
INSTRUCCIÓN TÉCNICA DE FORMATO DE RESPUESTA
(obligatoria, prevalece sobre cualquier otra indicación de formato de las
secciones anteriores; el consumidor de esta respuesta es un programa que
la parsea por código, no una persona)

Debes responder ÚNICAMENTE en uno de estos dos formatos, sin ningún texto
adicional antes o después, sin markdown y sin explicar tu razonamiento:

1. INFORMACIÓN SUFICIENTE: si la información suministrada es suficiente y
   no existe ninguna inconsistencia ni vacío crítico sin justificar,
   responde con el texto completo de la narración de los hechos en
   primera persona, sin títulos ni encabezados.

2. ACLARACIÓN REQUERIDA: si falta información crítica, existe una
   inconsistencia, o un vacío no justificado que impide redactar el
   informe conforme a las reglas anteriores, responde ÚNICAMENTE con una
   línea que comience exactamente así (respetando mayúsculas y el signo
   de dos puntos):

${MARCADOR_ACLARACION} <aquí la pregunta o preguntas específicas y concretas dirigidas al funcionario>

No mezcles ambos formatos en una misma respuesta.
`.trim();

    return [core, especializado, validaciones, flujo, capaRedaccion, capaTecnica].join(
      '\n\n---\n\n',
    );
  }

  private construirMensajeUsuario(
    contexto: ContextoNarracionFpj5,
    aclaraciones: string[],
  ): string {
    const partes = [
      'Genera la narración de los hechos para el FPJ-5 a partir de la ' +
        'siguiente información del procedimiento, suministrada en formato JSON:',
      '```json',
      JSON.stringify(contexto, null, 2),
      '```',
    ];

    if (aclaraciones.length > 0) {
      partes.push(
        '',
        'Aclaraciones adicionales suministradas por el funcionario en ' +
          'rondas anteriores de esta misma solicitud (en orden cronológico):',
        ...aclaraciones.map((a, i) => `${i + 1}. ${a}`),
      );
    }

    return partes.join('\n');
  }
}
