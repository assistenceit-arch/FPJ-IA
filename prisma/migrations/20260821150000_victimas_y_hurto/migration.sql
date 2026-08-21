-- Adenda 2026-08-21: módulo de Hurto -- activa la Sección 4 del FPJ 5
-- (Información de Víctimas), hasta ahora fija en N/A para todos los
-- delitos. Núcleo común -- transversal, misma dinámica que Testigo.

-- existenVictimas: Sí/No a nivel de procedimiento, mismo patrón que
-- existenTestigos.
ALTER TABLE "public"."actuaciones_procedimiento" ADD COLUMN "existenVictimas" BOOLEAN;

CREATE TABLE "public"."victimas" (
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
    "relacionIndiciado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "victimas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "victimas_procedimientoId_idx" ON "public"."victimas"("procedimientoId");

ALTER TABLE "public"."victimas" ADD CONSTRAINT "victimas_procedimientoId_fkey"
    FOREIGN KEY ("procedimientoId") REFERENCES "public"."procedimientos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Elementos incautados: vínculo opcional a la víctima a la que se le
-- hurtó el bien, y estado de recuperación (uso operativo exclusivo de
-- Hurto, pero se agrega a la entidad transversal ElementoIncautado).
ALTER TABLE "public"."elementos_incautados" ADD COLUMN "victimaId" TEXT;
ALTER TABLE "public"."elementos_incautados" ADD COLUMN "recuperado" BOOLEAN;
ALTER TABLE "public"."elementos_incautados" ADD COLUMN "recuperadoPor" TEXT;

CREATE INDEX "elementos_incautados_victimaId_idx" ON "public"."elementos_incautados"("victimaId");

ALTER TABLE "public"."elementos_incautados" ADD CONSTRAINT "elementos_incautados_victimaId_fkey"
    FOREIGN KEY ("victimaId") REFERENCES "public"."victimas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
