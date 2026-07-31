-- AlterTable
ALTER TABLE "public"."actuaciones_procedimiento"
  ADD COLUMN     "observacionInicial" TEXT,
  ADD COLUMN     "desarrolloIntervencion" TEXT,
  ADD COLUMN     "tieneCircunstanciaRelevante" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "circunstanciaRelevante" TEXT,
  ADD COLUMN     "tieneObservacionAdicional" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "observacionAdicional" TEXT;

-- AlterTable
ALTER TABLE "public"."capturados"
  ADD COLUMN     "participacionHechos" TEXT,
  ADD COLUMN     "comportamientoAbordaje" TEXT,
  ADD COLUMN     "identificacionPlena" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN     "formaIdentificacion" TEXT;
