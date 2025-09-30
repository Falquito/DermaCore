-- CreateEnum
CREATE TYPE "public"."TipoConsulta" AS ENUM ('OBRA_SOCIAL', 'PARTICULAR');
-- Archivo eliminado por reinicio de migraciones
-- AlterTable
ALTER TABLE "public"."appointments" ADD COLUMN     "autorizacion" TEXT,
ADD COLUMN     "copago" DECIMAL(65,30),
ADD COLUMN     "numeroAfiliado" TEXT,
ADD COLUMN     "obraSocialId" TEXT,
ADD COLUMN     "tipoConsulta" "public"."TipoConsulta" NOT NULL DEFAULT 'OBRA_SOCIAL';

-- AlterTable
ALTER TABLE "public"."patients" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."especialidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deactivatedById" TEXT,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_nombre_key" ON "public"."especialidades"("nombre");

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_obraSocialId_fkey" FOREIGN KEY ("obraSocialId") REFERENCES "public"."obras_sociales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."especialidades" ADD CONSTRAINT "especialidades_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."especialidades" ADD CONSTRAINT "especialidades_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."especialidades" ADD CONSTRAINT "especialidades_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
