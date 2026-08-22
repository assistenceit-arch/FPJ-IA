-- Adenda 2026-08-22: módulos de Violencia contra Servidor Público y
-- Violencia Intrafamiliar. Ambos extienden únicamente el modelo Victima
-- (núcleo común) con campos exclusivos de cada delito -- ninguno de los
-- dos necesita nuevas entidades ni cambios en las plantillas .docx (la
-- información es 100% narrativa, mismo criterio que Lesiones Personales).

-- Violencia contra Servidor Público
ALTER TABLE "public"."victimas" ADD COLUMN "entidadServidorPublico" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "cargoServidorPublico" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "uniformado" BOOLEAN;
ALTER TABLE "public"."victimas" ADD COLUMN "enEjercicioFunciones" BOOLEAN;
ALTER TABLE "public"."victimas" ADD COLUMN "indiciadoConocioCalidad" BOOLEAN;

-- Violencia Intrafamiliar
ALTER TABLE "public"."victimas" ADD COLUMN "relacionFamiliar" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "existenMedidasProteccion" BOOLEAN;
ALTER TABLE "public"."victimas" ADD COLUMN "descripcionMedidasProteccion" TEXT;
ALTER TABLE "public"."victimas" ADD COLUMN "existenAntecedentesViolencia" BOOLEAN;
ALTER TABLE "public"."victimas" ADD COLUMN "descripcionAntecedentesViolencia" TEXT;
