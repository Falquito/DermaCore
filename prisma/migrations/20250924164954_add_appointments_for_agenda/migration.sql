-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PENDING', 'WAITING', 'COMPLETED', 'CANCELED');
-- Archivo eliminado por reinicio de migraciones
-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "patientId" TEXT,
    "title" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_professionalId_start_end_idx" ON "public"."appointments"("professionalId", "start", "end");

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
