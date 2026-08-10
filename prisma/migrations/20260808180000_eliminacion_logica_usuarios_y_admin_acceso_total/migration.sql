-- AlterTable
-- Adenda 2026-08-08: eliminacion logica de usuarios (RT-006/AT-005,
-- mismo criterio ya usado en Procedimiento). Deliberadamente separado de
-- "activo" (bloqueo/desbloqueo temporal, ya existente) para no mezclar
-- ambos conceptos.
ALTER TABLE "public"."usuarios" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."usuarios" ADD COLUMN     "eliminadoEn" TIMESTAMP(3);
