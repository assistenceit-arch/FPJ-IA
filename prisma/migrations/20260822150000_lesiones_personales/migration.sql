-- Adenda 2026-08-22: módulo de Lesiones Personales.

-- Capturado: quién causó la lesión y con qué -- transversal a todos los
-- delitos (a solicitud del usuario), no exclusivo de este módulo.
ALTER TABLE "public"."capturados" ADD COLUMN "causanteLesion" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN "elementoCausante" TEXT;

-- Victima: bloque completo de estado físico/lesiones, mismo criterio
-- que Capturado (sin motivoLesion -- no aplica a víctimas).
ALTER TABLE "public"."victimas" ADD COLUMN "presentaLesiones" BOOLEAN;
ALTER TABLE "public"."victimas" ADD COLUMN "descripcionLesiones" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "parteCuerpoLesion" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "causanteLesion" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "elementoCausante" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "trasladoCentroAsistencial" BOOLEAN;
ALTER TABLE "public"."victimas" ADD COLUMN "centroAsistencial" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "motivoTraslado" TEXT;
