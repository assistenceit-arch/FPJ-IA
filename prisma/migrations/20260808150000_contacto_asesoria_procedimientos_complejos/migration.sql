-- AlterTable
-- Adenda 2026-08-08: datos de contacto (telefono/correo) para el mensaje
-- de asesoria que se muestra en el Bloque 8 de procedimientos COMPLEJOS
-- tras adjuntar el comprobante de pago.
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "contactoTelefono" TEXT;
ALTER TABLE "public"."configuracion_pagos" ADD COLUMN     "contactoCorreo" TEXT;
