-- Adenda 2026-08-20: se elimina el campo "modelo" del arma -- a
-- solicitud del usuario, no se utiliza operativamente en campo.
ALTER TABLE "public"."detalle_armas" DROP COLUMN "modelo";

-- Adenda 2026-08-20: autoridad receptora individualizada por grupo
-- (mayores/menores) para procedimientos mixtos -- el campo original
-- autoridadReceptora se conserva para procedimientos no mixtos.
ALTER TABLE "public"."actuaciones_procedimiento" ADD COLUMN     "autoridadReceptoraAdultos" TEXT;
ALTER TABLE "public"."actuaciones_procedimiento" ADD COLUMN     "autoridadReceptoraMenores" TEXT;
