-- CreateTable
CREATE TABLE "public"."configuracion_pagos" (
    "id" TEXT NOT NULL,
    "valorEstandar" DECIMAL(65,30) NOT NULL,
    "valorComplejo" DECIMAL(65,30) NOT NULL,
    "actualizadoPor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pagos_pkey" PRIMARY KEY ("id")
);
