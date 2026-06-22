-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "descricao" TEXT,
    "valorMensal" DECIMAL(14,2) NOT NULL,
    "diaVencimento" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contrato_clienteId_idx" ON "Contrato"("clienteId");

-- CreateIndex
CREATE INDEX "Contrato_status_idx" ON "Contrato"("status");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

