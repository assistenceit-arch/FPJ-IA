/*
  Warnings:

  - You are about to drop the column `documento` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identificacion]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `identificacion` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rol` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Usuario_documento_key";

-- DropIndex
DROP INDEX "public"."Usuario_uuid_key";

-- AlterTable
ALTER TABLE "public"."Usuario" DROP COLUMN "documento",
DROP COLUMN "uuid",
ADD COLUMN     "identificacion" TEXT NOT NULL,
ADD COLUMN     "rol" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_identificacion_key" ON "public"."Usuario"("identificacion");
