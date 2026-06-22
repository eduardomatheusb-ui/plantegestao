-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "portalToken" TEXT;

-- CreateTable
CREATE TABLE "Campanha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL DEFAULT 'meta',
    "objetivo" TEXT,
    "verba" DECIMAL(14,2),
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "observacao" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampanhaResultado" (
    "id" TEXT NOT NULL,
    "campanhaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "investido" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "alcance" INTEGER NOT NULL DEFAULT 0,
    "cliques" INTEGER NOT NULL DEFAULT 0,
    "conversoes" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampanhaResultado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campanha_clienteId_idx" ON "Campanha"("clienteId");

-- CreateIndex
CREATE INDEX "Campanha_status_idx" ON "Campanha"("status");

-- CreateIndex
CREATE INDEX "CampanhaResultado_campanhaId_idx" ON "CampanhaResultado"("campanhaId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_portalToken_key" ON "Cliente"("portalToken");

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampanhaResultado" ADD CONSTRAINT "CampanhaResultado_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Campanha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

