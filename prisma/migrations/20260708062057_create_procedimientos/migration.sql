-- CreateTable
CREATE TABLE "public"."Procedimiento" (
    "id" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nunc" TEXT,
    "fechaCaptura" TIMESTAMP(3) NOT NULL,
    "horaCaptura" TEXT NOT NULL,
    "fechaDisposicion" TIMESTAMP(3) NOT NULL,
    "horaDisposicion" TEXT NOT NULL,
    "delito" TEXT NOT NULL,
    "tipoProcedimiento" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "observacionesGenerales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedimiento_pkey" PRIMARY KEY ("id")
);
