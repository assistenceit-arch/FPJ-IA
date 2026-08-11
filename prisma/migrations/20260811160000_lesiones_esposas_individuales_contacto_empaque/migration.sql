-- Adenda 2026-08-11: limpieza de campos de acudiente duplicados/sin uso.
-- El formulario real siempre uso ContactoNotificacion; estos 3 nunca se
-- editaban desde el frontend tras la creacion inicial (quedaban
-- desactualizados) y NUNCA llegaban al contexto de la narrativa IA
-- (bug real detectado por el usuario: la IA preguntaba por este dato
-- una y otra vez aunque estuviera diligenciado, porque en realidad
-- estaba leyendo de la tabla equivocada).
ALTER TABLE "public"."capturados" DROP COLUMN "nombreAcudiente";
ALTER TABLE "public"."capturados" DROP COLUMN "parentescoAcudiente";
ALTER TABLE "public"."capturados" DROP COLUMN "telefonoAcudiente";

-- Esposas: tiempo y motivo de retiro (antes solo se pedia el momento).
ALTER TABLE "public"."capturados" ADD COLUMN     "tiempoEsposado" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN     "motivoRetiroEsposas" TEXT;

-- Lesiones: pasan de ser una sola respuesta por procedimiento (en
-- actuaciones_procedimiento) a individual por interviniente, mismo
-- criterio ya aplicado a esposas. Se agregan parteCuerpoLesion y
-- motivoLesion, que antes no existian en ningun lado.
ALTER TABLE "public"."capturados" ADD COLUMN     "presentaLesiones" BOOLEAN;
ALTER TABLE "public"."capturados" ADD COLUMN     "descripcionLesiones" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN     "parteCuerpoLesion" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN     "motivoLesion" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN     "trasladoCentroAsistencial" BOOLEAN;
ALTER TABLE "public"."capturados" ADD COLUMN     "centroAsistencial" TEXT;
ALTER TABLE "public"."capturados" ADD COLUMN     "motivoTraslado" TEXT;

-- Se quitan de actuaciones_procedimiento (mudaron a capturados). Sin
-- perdida de informacion relevante: no habia forma de tener mas de un
-- interviniente con lesiones distintas de todas formas.
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "presentaLesiones";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "descripcionLesiones";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "trasladoCentroAsistencial";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "centroAsistencial";
ALTER TABLE "public"."actuaciones_procedimiento" DROP COLUMN "motivoTraslado";

-- Contacto de notificacion: faltaba el parentesco (nombre y telefono ya
-- existian).
ALTER TABLE "public"."contactos_notificacion" ADD COLUMN     "parentesco" TEXT;

-- Tipo de empaque de la sustancia (bolsas, papeletas, frascos, cajas,
-- pastillas...), texto libre.
ALTER TABLE "public"."detalle_sustancias" ADD COLUMN     "tipoEmpaque" TEXT;
