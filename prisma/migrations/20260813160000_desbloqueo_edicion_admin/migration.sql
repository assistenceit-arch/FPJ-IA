-- Adenda 2026-08-13: un administrador puede desbloquear puntualmente la
-- edicion y regeneracion de documentos de un procedimiento ya congelado.
ALTER TABLE "public"."procedimientos" ADD COLUMN     "edicionDesbloqueada" BOOLEAN NOT NULL DEFAULT false;
