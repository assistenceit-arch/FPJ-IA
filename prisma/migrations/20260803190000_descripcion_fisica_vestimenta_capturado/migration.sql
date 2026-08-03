-- AlterTable
-- Adenda 2026-08-03: descripción física y de vestimenta del interviniente,
-- a solicitud del usuario (se ubica antes de señales particulares en el
-- formulario).
ALTER TABLE "public"."capturados" ADD COLUMN     "descripcionFisicaVestimenta" TEXT;
