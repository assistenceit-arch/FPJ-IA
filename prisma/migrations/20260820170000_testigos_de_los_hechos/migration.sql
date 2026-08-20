-- Adenda 2026-08-20: activa la Sección 5 del FPJ 5 (Testigos de los
-- Hechos), hasta ahora fija en N/A. Núcleo común -- transversal a todos
-- los delitos, misma dinámica de diligenciamiento que Capturado.

-- existenTestigos: Sí/No a nivel de procedimiento, mismo patrón que
-- tieneCircunstanciaRelevante/tieneObservacionAdicional.
ALTER TABLE "public"."actuaciones_procedimiento" ADD COLUMN "existenTestigos" BOOLEAN;

CREATE TABLE "public"."testigos" (
    "id" TEXT NOT NULL,
    "procedimientoId" TEXT NOT NULL,
    "primerNombre" TEXT NOT NULL,
    "segundoNombre" TEXT,
    "primerApellido" TEXT NOT NULL,
    "segundoApellido" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "expedicionDocumento" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "edad" INTEGER,
    "genero" TEXT,
    "paisNacimiento" TEXT,
    "departamentoNacimiento" TEXT,
    "municipioNacimiento" TEXT,
    "profesionOficio" TEXT,
    "estadoCivil" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testigos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "testigos_procedimientoId_idx" ON "public"."testigos"("procedimientoId");

ALTER TABLE "public"."testigos" ADD CONSTRAINT "testigos_procedimientoId_fkey"
    FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
