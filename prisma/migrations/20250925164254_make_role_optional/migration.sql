-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;
-- Archivo eliminado por reinicio de migraciones
