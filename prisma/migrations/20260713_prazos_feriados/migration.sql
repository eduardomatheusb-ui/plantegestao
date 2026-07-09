-- AlterTable
ALTER TABLE "JobTarefa" ADD COLUMN     "prazo" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_data_key" ON "Feriado"("data");

-- CreateIndex
CREATE INDEX "Feriado_data_idx" ON "Feriado"("data");

