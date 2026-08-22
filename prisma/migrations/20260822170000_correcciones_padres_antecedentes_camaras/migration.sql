-- Adenda 2026-08-22: correcciones tras caso real de violencia
-- intrafamiliar.

-- Capturado: antecedentes y pertenencia a organización delincuencial,
-- ahora estructurados y disponibles para cualquier interviniente (antes
-- exclusivos de SRPA y preguntados por la IA en cada narrativa).
ALTER TABLE "public"."capturados" ADD COLUMN "tieneProcedimientosAnteriores" BOOLEAN;
ALTER TABLE "public"."capturados" ADD COLUMN "descripcionProcedimientosAnteriores" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN "perteneceGrupoDelincuencial" BOOLEAN;
ALTER TABLE "public"."capturados" ADD COLUMN "descripcionGrupoDelincuencial" TEXT;

-- LugarProcedimiento: existencia de cámaras, ahora estructurado (antes
-- preguntado por la IA en cada narrativa).
ALTER TABLE "public"."lugares_procedimiento" ADD COLUMN "existenCamaras" BOOLEAN;
ALTER TABLE "public"."lugares_procedimiento" ADD COLUMN "descripcionCamaras" TEXT;

-- Nota: el fix del bug de nombrePadres/telefonoPadres (se reseteaban a
-- "No aportó" en cada guardado parcial desde otra pantalla) es un
-- cambio de código en capturados.service.ts, no requiere columnas
-- nuevas ni cambia el tipo de las existentes.
