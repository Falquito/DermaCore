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
    "nroAfiliado" TEXT,
    "tipoConsulta" TEXT NOT NULL,
    "montoConsulta" DOUBLE PRECISION,
    "idPaciente" INTEGER NOT NULL,
    "idObraSocial" INTEGER,

    CONSTRAINT "Consultas_pkey" PRIMARY KEY ("idConsulta")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
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
CREATE INDEX "Consultas_idPaciente_fechaHoraConsulta_idx" ON "Consultas"("idPaciente", "fechaHoraConsulta");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_idPaciente_fkey" FOREIGN KEY ("idPaciente") REFERENCES "Paciente"("idPaciente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_idObraSocial_fkey" FOREIGN KEY ("idObraSocial") REFERENCES "ObraSocial"("idObraSocial") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
