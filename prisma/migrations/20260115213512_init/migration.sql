-- CreateTable
CREATE TABLE "Paciente" (
    "idPaciente" SERIAL NOT NULL,
    "nombrePaciente" TEXT NOT NULL,
    "apellidoPaciente" TEXT NOT NULL,
    "telefonoPaciente" TEXT,
    "domicilioPaciente" TEXT,
    "dniPaciente" TEXT NOT NULL,
    "fechaHoraPaciente" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoPaciente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("idPaciente")
);

-- CreateTable
CREATE TABLE "ObraSocial" (
    "idObraSocial" SERIAL NOT NULL,
    "nombreObraSocial" TEXT NOT NULL,
    "estadoObraSocial" BOOLEAN NOT NULL DEFAULT true,
    "fechaHoraObraSocial" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObraSocial_pkey" PRIMARY KEY ("idObraSocial")
);

-- CreateTable
CREATE TABLE "Consultas" (
    "idConsulta" SERIAL NOT NULL,
    "motivoConsulta" TEXT NOT NULL,
    "diagnosticoConsulta" TEXT,
    "tratamientoConsulta" TEXT,
    "fechaHoraConsulta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idPaciente" INTEGER NOT NULL,
    "idObraSocial" INTEGER NOT NULL,

    CONSTRAINT "Consultas_pkey" PRIMARY KEY ("idConsulta")
);

-- CreateTable
CREATE TABLE "PacienteXObra" (
    "idPacientexObra" SERIAL NOT NULL,
    "idPaciente" INTEGER NOT NULL,
    "idObraSocial" INTEGER NOT NULL,

    CONSTRAINT "PacienteXObra_pkey" PRIMARY KEY ("idPacientexObra")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_dniPaciente_key" ON "Paciente"("dniPaciente");

-- CreateIndex
CREATE UNIQUE INDEX "ObraSocial_nombreObraSocial_key" ON "ObraSocial"("nombreObraSocial");

-- CreateIndex
CREATE INDEX "Consultas_idPaciente_idx" ON "Consultas"("idPaciente");

-- CreateIndex
CREATE INDEX "Consultas_idObraSocial_idx" ON "Consultas"("idObraSocial");

-- CreateIndex
CREATE INDEX "PacienteXObra_idObraSocial_idx" ON "PacienteXObra"("idObraSocial");

-- CreateIndex
CREATE UNIQUE INDEX "PacienteXObra_idPaciente_idObraSocial_key" ON "PacienteXObra"("idPaciente", "idObraSocial");

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_idPaciente_fkey" FOREIGN KEY ("idPaciente") REFERENCES "Paciente"("idPaciente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_idObraSocial_fkey" FOREIGN KEY ("idObraSocial") REFERENCES "ObraSocial"("idObraSocial") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteXObra" ADD CONSTRAINT "PacienteXObra_idPaciente_fkey" FOREIGN KEY ("idPaciente") REFERENCES "Paciente"("idPaciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteXObra" ADD CONSTRAINT "PacienteXObra_idObraSocial_fkey" FOREIGN KEY ("idObraSocial") REFERENCES "ObraSocial"("idObraSocial") ON DELETE CASCADE ON UPDATE CASCADE;
