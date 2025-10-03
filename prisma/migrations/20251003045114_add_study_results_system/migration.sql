-- CreateEnum
CREATE TYPE "public"."StudyStatus" AS ENUM ('ORDENADO', 'COMPLETADO');

-- AlterTable
ALTER TABLE "public"."study_order_items" ADD COLUMN     "estado" "public"."StudyStatus" NOT NULL DEFAULT 'ORDENADO';

-- CreateTable
CREATE TABLE "public"."study_results" (
    "id" TEXT NOT NULL,
    "studyOrderItemId" TEXT NOT NULL,
    "fechaRealizacion" TIMESTAMP(3) NOT NULL,
    "laboratorio" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "study_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_result_items" (
    "id" TEXT NOT NULL,
    "studyResultId" TEXT NOT NULL,
    "parametro" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "unidad" TEXT,
    "valorReferencia" TEXT,
    "esNormal" BOOLEAN,

    CONSTRAINT "study_result_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_results_studyOrderItemId_key" ON "public"."study_results"("studyOrderItemId");

-- AddForeignKey
ALTER TABLE "public"."study_results" ADD CONSTRAINT "study_results_studyOrderItemId_fkey" FOREIGN KEY ("studyOrderItemId") REFERENCES "public"."study_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_results" ADD CONSTRAINT "study_results_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_result_items" ADD CONSTRAINT "study_result_items_studyResultId_fkey" FOREIGN KEY ("studyResultId") REFERENCES "public"."study_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
