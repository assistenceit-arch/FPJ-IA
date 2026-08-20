// Contexto estructurado que se envía al modelo de IA para generar la
// narración de los hechos del FPJ-5 (REGLA INV-FPJ5-002: la narrativa se
// construye a partir de Servicio Prestado, Lugar, Intervinientes, Elementos
// Hallados y Actuaciones Realizadas — únicamente variables ya persistidas
// en el Modelo de Datos V1, sin campos de texto libre adicionales).

export interface ElementoNarracion {
  tipoElemento: string; // SUSTANCIA | DINERO | CELULAR | OTRO
  descripcionBase: string;
  ubicacionHallazgo: string;
  direccionIncautacion: string;
  observaciones?: string | null;
}

export interface IntervinienteNarracion {
  tipoInterviniente: string; // CAPTURADO | APREHENDIDO
  nombreCompleto: string;
  edad: number;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  elementos: ElementoNarracion[];
  // Adenda 2026-07-22 (Bloque 5/6): datos individuales para reducir la
  // dependencia del ciclo de aclaraciones.
  participacionHechos?: string | null;
  comportamientoAbordaje?: string | null;
  identificacionPlena: boolean;
  formaIdentificacion?: string | null;
  // Adenda 2026-08-06: faltaba por completo -- el dato se capturaba en
  // el Bloque 2 pero nunca llegaba al contexto que se le manda a la IA,
  // así que el FPJ-5 nunca lo mencionaba.
  escolaridad?: string | null;
  // Adenda 2026-08-03: uso de esposas pasa a ser individual por
  // interviniente (antes vivía en `actuaciones`, general para todo el
  // procedimiento).
  usoEsposas?: boolean | null;
  justificacionEsposas?: string | null;
  // Adenda 2026-08-11: tiempo y motivo de retiro, junto con la
  // justificación de por qué se colocaron.
  tiempoEsposado?: string | null;
  motivoRetiroEsposas?: string | null;

  // Adenda 2026-08-11: lesiones pasan a ser individuales por
  // interviniente (antes vivían en `actuaciones`, general para todo el
  // procedimiento) -- mismo criterio ya aplicado a esposas.
  presentaLesiones?: boolean | null;
  descripcionLesiones?: string | null;
  parteCuerpoLesion?: string | null;
  motivoLesion?: string | null;
  trasladoCentroAsistencial?: boolean | null;
  centroAsistencial?: string | null;
  motivoTraslado?: string | null;

  // Adenda 2026-08-12: exclusivo del módulo de Porte Ilegal de Armas de
  // Fuego. PORTE | TENENCIA | NINGUNO | null (procedimiento de otro
  // delito).
  tipoPermisoArma?: string | null;

  // Adenda 2026-08-11: corrige un bug real -- este dato se diligenciaba
  // en el Bloque 2 (Contacto de notificación) pero nunca llegaba al
  // contexto de la narrativa IA, así que el sistema preguntaba por él
  // en cada generación sin importar que ya estuviera guardado. `null`
  // cuando el interviniente no tiene un registro de contacto todavía.
  contacto?: {
    nombre?: string | null;
    parentesco?: string | null;
    telefono?: string | null;
    comunicacionExitosa: boolean;
    horaComunicacion?: string | null;
    justificacionNoComunicacion?: string | null;
  } | null;
}

export interface ContextoNarracionFpj5 {
  procedimiento: {
    delito: string;
    tipoProcedimiento: string;
    fechaCaptura: string; // ISO
    horaCaptura: string;
    fechaDisposicion: string; // ISO
    horaDisposicion: string;
  };
  funcionario: {
    nombreCompleto: string;
    cargo: string;
    placa: string;
    servicio: string;
    estacion: string;
    cai?: string | null;
  };
  companero: {
    nombreCompleto: string;
    placa: string;
    grado?: string | null;
  } | null;
  lugar: {
    departamento: string;
    municipio: string;
    barrio: string;
    direccion: string;
    caracteristicas?: string | null;
  };
  intervinientes: IntervinienteNarracion[];
  // Adenda 2026-08-14: elementos "sin individualizar" -- hallados en un
  // lugar común (ej. interior de un vehículo) sin poder atribuirse a
  // una persona específica, pero que dieron lugar a la captura de
  // todos los intervinientes del procedimiento. Separado de la lista
  // de `elementos` de cada interviniente porque, precisamente, no
  // pertenecen a ninguno en particular.
  elementosSinIndividualizar: ElementoNarracion[];
  actuaciones: {
    derechosLeidos: boolean;
    fechaDerechos: string;
    horaDerechos: string;
    comprendeDerechos: boolean;
    autoridadReceptora: string;
    // Adenda 2026-08-20: en procedimientos mixtos, la autoridad
    // receptora puede diferir para mayores y menores de edad.
    autoridadReceptoraAdultos?: string | null;
    autoridadReceptoraMenores?: string | null;
    demoraExistente: boolean;
    justificacionDemora?: string | null;
    // Adenda 2026-07-22 (Bloque 5/6):
    observacionInicial?: string | null;
    desarrolloIntervencion?: string | null;
    circunstanciaRelevante?: string | null;
    observacionAdicional?: string | null;
  };
}

export type ResultadoNarracion =
  | { tipo: 'narracion'; texto: string }
  | { tipo: 'aclaracion_requerida'; pregunta: string };
