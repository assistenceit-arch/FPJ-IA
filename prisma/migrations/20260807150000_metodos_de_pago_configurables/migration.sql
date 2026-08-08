-- AlterTable
-- Adenda 2026-08-07: metodos de pago configurables desde el panel de
-- administracion (Nequi, cuenta bancaria, tarjeta), cada uno con su
-- propio interruptor de habilitado/deshabilitado. Se muestran al
-- funcionario en el Bloque 8 antes de adjuntar el comprobante.
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "nequiHabilitado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "nequiNumero" TEXT;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "cuentaHabilitada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "cuentaBanco" TEXT;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "cuentaTipo" TEXT;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "cuentaNumero" TEXT;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "tarjetaHabilitada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "tarjetaInstrucciones" TEXT;
