-- CreateTable for obras_sociales to match Prisma model ObraSocial
CREATE TABLE "public"."obras_sociales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
-- Archivo eliminado por reinicio de migraciones
    CONSTRAINT "obras_sociales_pkey" PRIMARY KEY ("id")
);

-- Unique constraints as defined in schema
CREATE UNIQUE INDEX "obras_sociales_nombre_key" ON "public"."obras_sociales"("nombre");
CREATE UNIQUE INDEX "obras_sociales_codigo_key" ON "public"."obras_sociales"("codigo");
