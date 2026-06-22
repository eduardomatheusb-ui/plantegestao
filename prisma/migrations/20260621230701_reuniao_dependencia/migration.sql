-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "bloqueadoPorId" TEXT;

-- CreateTable
CREATE TABLE "Reuniao" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT,
    "participantes" TEXT,
    "pauta" TEXT,
    "decisoes" TEXT,
    "proximosPassos" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reuniao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reuniao_data_idx" ON "Reuniao"("data");

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_bloqueadoPorId_fkey" FOREIGN KEY ("bloqueadoPorId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

