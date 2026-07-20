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
      max_tokens: 2000,
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

    return [core, especializado, validaciones, flujo, capaTecnica].join(
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
