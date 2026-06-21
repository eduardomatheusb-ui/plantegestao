-- CreateEnum
CREATE TYPE "PropostaStatus" AS ENUM ('EM_ABERTO', 'ENVIADA', 'APROVADA', 'REPROVADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "projetoId" TEXT,
    "responsavelId" TEXT,
    "status" "PropostaStatus" NOT NULL DEFAULT 'EM_ABERTO',
    "validadeDias" INTEGER NOT NULL DEFAULT 30,
    "prazo" TIMESTAMP(3),
    "introducao" TEXT,
    "valorTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropostaItem" (
    "id" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "produtoId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valorUnit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantidade" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropostaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposta_numero_key" ON "Proposta"("numero");

-- CreateIndex
CREATE INDEX "Proposta_clienteId_idx" ON "Proposta"("clienteId");

-- CreateIndex
CREATE INDEX "Proposta_status_idx" ON "Proposta"("status");

-- CreateIndex
CREATE INDEX "PropostaItem_propostaId_idx" ON "PropostaItem"("propostaId");

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "Proposta_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropostaItem" ADD CONSTRAINT "PropostaItem_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "Proposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropostaItem" ADD CONSTRAINT "PropostaItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
