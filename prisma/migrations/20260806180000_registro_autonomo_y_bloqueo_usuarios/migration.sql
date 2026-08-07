-- AlterTable
-- Adenda 2026-08-06: apellidos/identificacion pasan a opcionales -- el
-- registro autonomo solo pide nombre completo, correo y telefono. La
-- creacion por un administrador sigue exigiendolos a nivel de DTO.
ALTER TABLE "public"."usuarios" ALTER COLUMN "apellidos" DROP NOT NULL;
ALTER TABLE "public"."usuarios" ALTER COLUMN "identificacion" DROP NOT NULL;

-- Nuevo: telefono (requerido en el registro autonomo, opcional aqui por
-- los usuarios ya existentes creados antes de este campo).
ALTER TABLE "public"."usuarios" ADD COLUMN     "telefono" TEXT;

-- Nuevo: verificacion de correo para el registro autonomo.
ALTER TABLE "public"."usuarios" ADD COLUMN     "correoVerificado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."usuarios" ADD COLUMN     "tokenVerificacion" TEXT;
ALTER TABLE "public"."usuarios" ADD COLUMN     "tokenVerificacionExpira" TIMESTAMP(3);
CREATE UNIQUE INDEX "usuarios_tokenVerificacion_key" ON "public"."usuarios"("tokenVerificacion");

-- IMPORTANTE: los usuarios que YA existian antes de este cambio (creados
-- por un administrador o por Thunder Client) se marcan como verificados
-- automaticamente -- de lo contrario quedarian bloqueados para iniciar
-- sesion, ya que el login ahora exige correoVerificado=true. Solo las
-- cuentas nuevas creadas via el registro autonomo empiezan en false.
UPDATE "public"."usuarios" SET "correoVerificado" = true;
