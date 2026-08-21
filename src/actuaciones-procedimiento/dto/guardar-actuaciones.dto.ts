import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

// Adenda 2026-08-03: fechaDerechos, horaDerechos y autoridadReceptora
// pasan de obligatorios a opcionales, igual que los campos condicionales
// (descripcionLesiones, centroAsistencial, motivoTraslado,
// circunstanciaRelevante, observacionAdicional), para permitir guardado
// parcial (borrador). Antes, mientras faltara CUALQUIERA de estos, el
// backend rechazaba TODO el objeto — incluyendo campos sin relación como
// el relato del Bloque 6, que comparte este mismo registro. La
// obligatoriedad para considerar el bloque "completo" ahora se controla
// únicamente en el frontend (ver estadoActuaciones/estadoRelato en
// src/lib/estados.ts del frontend).
//
// usoEsposas/justificacionEsposas se removieron de este DTO el
// 2026-08-03: pasaron a ser una pregunta individual por interviniente
// (ver CrearCapturadoDto), no una respuesta general del procedimiento.
//
// Adenda 2026-08-21: derechosLeidos/fechaDerechos/horaDerechos/
// comprendeDerechos se remueven de aquí por el mismo motivo -- pasan a
// ser individuales por interviniente (ver CrearCapturadoDto), porque
// cada persona puede haber sido capturada/aprehendida en un momento
// distinto dentro del mismo procedimiento.
export class GuardarActuacionesDto {
  // ── Autoridad receptora / puesta a disposición ──
  // Adenda 2026-08-11: presentaLesiones/descripcionLesiones/
  // trasladoCentroAsistencial/centroAsistencial/motivoTraslado se
  // quitan de aquí por el mismo motivo -- pasan a ser individuales por
  // interviniente (mismo criterio que esposas).

  // ── Puesta a disposición ──
  @IsOptional()
  @IsString()
  autoridadReceptora?: string;

  // Adenda 2026-08-20: para procedimientos mixtos -- ver comentario en
  // el schema.
  @IsOptional()
  @IsString()
  autoridadReceptoraAdultos?: string;

  @IsOptional()
  @IsString()
  autoridadReceptoraMenores?: string;

  // demoraExistente ya no se recibe del cliente NI se persiste (Adenda
  // 2026-08-04): se calcula al vuelo cada vez que se consulta (ver
  // demora.util.ts), comparando la hora de captura (sincronizada con la
  // de derechos) y la de puesta a disposición del procedimiento, con el
  // umbral de 5 horas del CORE_TRANSVERSAL. justificacionDemora sí se
  // guarda tal cual la escriba el usuario.
  @IsOptional()
  @IsString()
  justificacionDemora?: string;

  // ── Bloque 5/6: Relato de los hechos (Adenda 2026-07-22) ──
  // Alimentan directamente el contexto de la narrativa IA, reduciendo la
  // dependencia del ciclo de aclaraciones.
  @IsOptional()
  @IsString()
  observacionInicial?: string;

  @IsOptional()
  @IsString()
  desarrolloIntervencion?: string;

  @IsOptional()
  @IsBoolean()
  tieneCircunstanciaRelevante?: boolean;

  @ValidateIf((o) => o.tieneCircunstanciaRelevante === true)
  @IsString()
  circunstanciaRelevante?: string;

  @IsOptional()
  @IsBoolean()
  tieneObservacionAdicional?: boolean;

  @ValidateIf((o) => o.tieneObservacionAdicional === true)
  @IsString()
  observacionAdicional?: string;

  // Adenda 2026-08-20: existencia de testigos de los hechos (Sección 5
  // del FPJ 5). Si es true, el listado de testigos se diligencia por
  // separado (ver TestigosController) con la misma dinámica que
  // Intervinientes; si es false o no se responde, la sección se genera
  // en N/A tal como hasta ahora.
  @IsOptional()
  @IsBoolean()
  existenTestigos?: boolean;

  // Adenda 2026-08-21 (módulo Hurto): existencia de víctimas
  // identificables (Sección 4 del FPJ 5). Mismo patrón que
  // existenTestigos.
  @IsOptional()
  @IsBoolean()
  existenVictimas?: boolean;
}
