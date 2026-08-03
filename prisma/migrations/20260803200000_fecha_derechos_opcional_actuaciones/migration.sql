-- AlterTable
-- Adenda 2026-08-03: fechaDerechos pasa a ser opcional para permitir
-- guardado parcial (borrador) del Bloque 5 (Actuaciones procedimentales)
-- mientras el formulario todavia no esta completo. horaDerechos y
-- autoridadReceptora ya eran String (NOT NULL) pero admiten cadena vacia
-- sin necesidad de migracion.
ALTER TABLE "public"."actuaciones_procedimiento" ALTER COLUMN "fechaDerechos" DROP NOT NULL;
