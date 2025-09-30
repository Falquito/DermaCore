-- Drop existing appointments table and enum since they don't match schema
DROP TABLE IF EXISTS "public"."appointments";
DROP TYPE IF EXISTS "public"."AppointmentStatus";
-- Archivo eliminado por reinicio de migraciones
-- Create the correct AppointmentStatus enum with Spanish values
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PROGRAMADO', 'CONFIRMADO', 'EN_SALA_DE_ESPERA', 'COMPLETADO', 'CANCELADO', 'NO_ASISTIO');

-- Create patients table (required by appointments foreign key)
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "genero" TEXT NOT NULL,
    "telefono" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "codigoPostal" TEXT,
    "contactoEmergenciaNombre" TEXT,
    "contactoEmergenciaTelefono" TEXT,
    "contactoEmergenciaRelacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- Create appointments table with correct Spanish fields
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL DEFAULT 30,
    "motivo" TEXT,
    "observaciones" TEXT,
    "estado" "public"."AppointmentStatus" NOT NULL DEFAULT 'PROGRAMADO',
    "pacienteId" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for patients DNI
CREATE UNIQUE INDEX "patients_dni_key" ON "public"."patients"("dni");

-- Add foreign key constraints for appointments
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;