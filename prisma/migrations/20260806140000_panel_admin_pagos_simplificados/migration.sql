-- AlterTable
-- Adenda 2026-08-06: comprobantePago pasa a NOT NULL (ya era obligatorio
-- a nivel de aplicacion desde el parche anterior; ahora tambien lo es en
-- la base de datos). Si existieran filas con comprobantePago NULL de
-- antes de ese cambio, esta migracion fallaria -- no debería haber
-- ninguna, pero revisa antes de aplicar si tienes datos reales.
ALTER TABLE "public"."pagos" ALTER COLUMN "comprobantePago" SET NOT NULL;

-- fechaPago/medioPago/referenciaPago se quitan por completo: el
-- funcionario ya no llena un formulario de texto, solo adjunta el
-- comprobante.
ALTER TABLE "public"."pagos" DROP COLUMN "fechaPago";
ALTER TABLE "public"."pagos" DROP COLUMN "medioPago";
ALTER TABLE "public"."pagos" DROP COLUMN "referenciaPago";

-- AlterTable
-- Nuevo: exoneracion de pago por procedimiento, otorgada por un
-- administrador desde el panel de administracion.
ALTER TABLE "public"."procedimientos" ADD COLUMN     "exoneradoPago" BOOLEAN NOT NULL DEFAULT false;
