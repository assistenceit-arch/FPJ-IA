-- AlterTable
-- Adenda 2026-08-03: el uso de esposas pasa de ser una sola respuesta
-- para todo el procedimiento a una pregunta individual por interviniente
-- (a solicitud del usuario, para procedimientos mixtos donde solo a
-- algunos intervinientes -- tipicamente Aprehendidos/menores -- se les
-- colocan esposas). Se elimina de actuaciones_procedimiento y se agrega
-- a capturados.
--
-- ADVERTENCIA: esto borra cualquier respuesta ya guardada en
-- actuaciones_procedimiento.usoEsposas/justificacionEsposas. Si ya hay
-- procedimientos reales con esa informacion diligenciada, revisa antes
-- de aplicar si necesitas migrar esos datos manualmente a capturados
-- primero (no hay forma automatica de saber a cual interviniente
-- corresponderia una respuesta que era general).
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "usoEsposas";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "justificacionEsposas";

ALTER TABLE "public"."capturados" ADD COLUMN     "usoEsposas" BOOLEAN;
ALTER TABLE "public"."capturados" ADD COLUMN     "justificacionEsposas" TEXT;
