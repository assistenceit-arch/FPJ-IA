-- AlterTable
ALTER TABLE "public"."procedimientos"
  ALTER COLUMN "fechaDisposicion" DROP NOT NULL,
  ALTER COLUMN "horaDisposicion" DROP NOT NULL,
  ALTER COLUMN "estado" SET DEFAULT 'Borrador';
