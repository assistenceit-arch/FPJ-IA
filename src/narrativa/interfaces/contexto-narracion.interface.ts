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
  };
  companero: {
    nombreCompleto: string;
    placa: string;
  } | null;
  lugar: {
    departamento: string;
    municipio: string;
    barrio: string;
    direccion: string;
    caracteristicas?: string | null;
  };
  intervinientes: IntervinienteNarracion[];
  actuaciones: {
    derechosLeidos: boolean;
    fechaDerechos: string;
    horaDerechos: string;
    comprendeDerechos: boolean;
    usoEsposas: boolean;
    justificacionEsposas?: string | null;
    presentaLesiones: boolean;
    descripcionLesiones?: string | null;
    trasladoCentroAsistencial: boolean;
    centroAsistencial?: string | null;
    motivoTraslado?: string | null;
    autoridadReceptora: string;
    demoraExistente: boolean;
    justificacionDemora?: string | null;
  };
}

export type ResultadoNarracion =
  | { tipo: 'narracion'; texto: string }
  | { tipo: 'aclaracion_requerida'; pregunta: string };
