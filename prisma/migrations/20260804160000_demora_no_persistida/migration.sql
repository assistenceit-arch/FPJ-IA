-- AlterTable
-- Adenda 2026-08-04: demoraExistente deja de persistirse como snapshot y
-- pasa a calcularse siempre al vuelo (ver src/actuaciones-procedimiento/
-- demora.util.ts), para que nunca quede desactualizado si se edita la
-- puesta a disposicion despues de haber guardado las actuaciones (o
-- viceversa). justificacionDemora se conserva -- es contenido real
-- escrito por el usuario.
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "demoraExistente";
