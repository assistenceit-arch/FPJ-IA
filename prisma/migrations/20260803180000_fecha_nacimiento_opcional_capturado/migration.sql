-- AlterTable
-- Adenda 2026-08-03: la fecha de nacimiento del interviniente pasa a ser
-- opcional. Cuando la persona no la aporta, el funcionario digita la edad
-- manualmente (campo transitorio "edadManual" en el DTO, no se persiste) y
-- se guarda en "edad"; "fechaNacimiento" queda en NULL en ese caso.
ALTER TABLE "public"."capturados" ALTER COLUMN "fechaNacimiento" DROP NOT NULL;
