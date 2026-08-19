-- Adenda 2026-08-14: un elemento incautado puede quedar "sin
-- individualizar" -- hallado en un lugar comun (ej. interior de un
-- vehiculo con varios ocupantes) sin poder atribuirse a una persona
-- especifica, pero que de todas formas da lugar a la captura de todos
-- los intervinientes del procedimiento. capturadoId pasa de obligatorio
-- a opcional.

-- Se elimina primero la llave foranea y se vuelve a crear permitiendo
-- NULL (Prisma no genera un ALTER COLUMN DROP NOT NULL solo, hay que
-- tocar la constraint tambien segun el motor -- en Postgres basta con
-- ALTER COLUMN, se deja explicito el paso completo por seguridad).
ALTER TABLE "public"."elementos_incautados" DROP CONSTRAINT IF EXISTS "elementos_incautados_capturadoId_fkey";
ALTER TABLE "public"."elementos_incautados" ALTER COLUMN "capturadoId" DROP NOT NULL;
ALTER TABLE "public"."elementos_incautados" ADD CONSTRAINT "elementos_incautados_capturadoId_fkey"
    FOREIGN KEY ("capturadoId") REFERENCES "public"."capturados"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
