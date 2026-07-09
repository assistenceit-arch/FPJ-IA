-- CreateTable
CREATE TABLE "public"."FormularioMaestro" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "informacionOperativa" JSONB,
    "ubicacion" JSONB,
    "capturados" JSONB,
    "victimas" JSONB,
    "bienesIncautados" JSONB,
    "testigos" JSONB,
    "actuaciones" JSONB,
    "observaciones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormularioMaestro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormularioMaestro_procedimientoId_key" ON "public"."FormularioMaestro"("procedimientoId");

-- AddForeignKey
ALTER TABLE "public"."FormularioMaestro" ADD CONSTRAINT "FormularioMaestro_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "public"."Procedimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
