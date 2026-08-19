-- Adenda 2026-08-13: correcciones al modulo de armas a solicitud del
-- usuario, tras la primera revision del formulario en la practica.

-- 1. Estado del arma pasa de 2 a 3 opciones (BUEN_ESTADO/REGULAR_ESTADO/
--    MAL_ESTADO). No requiere cambio de columna (sigue siendo TEXT sin
--    restriccion a nivel de base de datos, la restriccion vive en el DTO);
--    las filas existentes con BUEN_ESTADO/MAL_ESTADO siguen siendo validas.

-- 2. Serial: reemplaza el booleano serialLegible por un estado
--    categorico de 5 opciones (LEGIBLE/NO_PRESENTA/BORRADO/ALTERADO/
--    NO_LEGIBLE). Se migra el dato existente antes de eliminar la
--    columna vieja.
ALTER TABLE "public"."detalle_armas" ADD COLUMN "estadoSerial" TEXT;
UPDATE "public"."detalle_armas"
  SET "estadoSerial" = CASE WHEN "serialLegible" THEN 'LEGIBLE' ELSE 'NO_LEGIBLE' END;
ALTER TABLE "public"."detalle_armas" ALTER COLUMN "estadoSerial" SET NOT NULL;
ALTER TABLE "public"."detalle_armas" DROP COLUMN "serialLegible";

-- 3. Cacha/empuñadura: material y color, nuevos.
ALTER TABLE "public"."detalle_armas" ADD COLUMN "cachaMaterial" TEXT;
ALTER TABLE "public"."detalle_armas" ADD COLUMN "cachaColor" TEXT;

-- 4. Calibre de la municion: reemplaza el booleano
--    calibreMunicionCoincide (que asumia el calibre del arma) por un
--    campo de texto preguntado de forma independiente -- nunca debe
--    asumirse igual al calibre del arma.
ALTER TABLE "public"."detalle_armas" ADD COLUMN "calibreMunicion" TEXT;
ALTER TABLE "public"."detalle_armas" DROP COLUMN "calibreMunicionCoincide";
