-- Adenda 2026-08-12: modulo de Porte Ilegal de Armas de Fuego.
-- Alcance confirmado: solo armas de fuego (pistola, revolver,
-- escopeta, fusil) y armas hechizas/artesanales, con su municion.

CREATE TABLE "public"."detalle_armas" (
    "id" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "tipoArma" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "calibre" TEXT,
    "color" TEXT,
    "serial" TEXT,
    "serialLegible" BOOLEAN NOT NULL,
    "estadoArma" TEXT NOT NULL,
    "cantidadMuniciones" INTEGER,
    "calibreMunicionCoincide" BOOLEAN,
    "cantidadCargadores" INTEGER,

    CONSTRAINT "detalle_armas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "detalle_armas_elementoId_key" ON "public"."detalle_armas"("elementoId");

ALTER TABLE "public"."detalle_armas" ADD CONSTRAINT "detalle_armas_elementoId_fkey"
    FOREIGN KEY ("elementoId") REFERENCES "public"."elementos_incautados"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Permiso de porte/tenencia -- individual por interviniente, igual que
-- esposas/lesiones.
ALTER TABLE "public"."capturados" ADD COLUMN     "tipoPermisoArma" TEXT;
