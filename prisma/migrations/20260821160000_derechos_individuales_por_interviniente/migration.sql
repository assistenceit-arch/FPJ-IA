-- Adenda 2026-08-21: la lectura de derechos deja de ser una sola
-- respuesta por procedimiento y pasa a ser individual por interviniente
-- (bug real reportado tras caso en vivo: no permitía capturas/aprehensiones
-- en horas distintas dentro de un mismo procedimiento). Mismo criterio ya
-- aplicado a esposas/lesiones/permiso de arma.

ALTER TABLE "public"."capturados" ADD COLUMN "derechosLeidos" BOOLEAN;
ALTER TABLE "public"."capturados" ADD COLUMN "fechaCaptura" TIMESTAMP(3);
ALTER TABLE "public"."capturados" ADD COLUMN "horaCaptura" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN "comprendeDerechos" BOOLEAN;

ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "derechosLeidos";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "fechaDerechos";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "horaDerechos";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "comprendeDerechos";
