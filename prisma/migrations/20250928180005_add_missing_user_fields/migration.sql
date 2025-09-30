/*
  Warnings:
-- Archivo eliminado por reinicio de migraciones
  - A unique constraint covering the columns `[dni]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "apellido" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "especialidadId" TEXT,
ADD COLUMN     "telefono" TEXT;

-- CreateTable
CREATE TABLE "public"."appointment_cancellations" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "cancelledById" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."professional_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_cancellations_appointmentId_key" ON "public"."appointment_cancellations"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_schedules_userId_dayOfWeek_key" ON "public"."professional_schedules"("userId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "users_dni_key" ON "public"."users"("dni");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "public"."especialidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointment_cancellations" ADD CONSTRAINT "appointment_cancellations_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."professional_schedules" ADD CONSTRAINT "professional_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
