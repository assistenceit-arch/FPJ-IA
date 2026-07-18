const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function nombreMes(fecha: Date): string {
  return MESES[fecha.getUTCMonth()];
}

export function nombreCompleto(persona: {
  primerNombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
}): string {
  return [
    persona.primerNombre,
    persona.segundoNombre,
    persona.primerApellido,
    persona.segundoApellido,
  ]
    .filter(Boolean)
    .join(' ');
}
