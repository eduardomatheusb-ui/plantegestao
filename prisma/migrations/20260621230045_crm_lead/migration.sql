-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa" TEXT,
    "origem" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "valorEstimado" DECIMAL(14,2),
    "etapa" TEXT NOT NULL DEFAULT 'novo',
    "responsavelId" TEXT,
    "observacao" TEXT,
    "motivoPerda" TEXT,
    "clienteId" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_etapa_idx" ON "Lead"("etapa");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

