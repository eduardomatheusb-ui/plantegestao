-- CreateEnum
CREATE TYPE "LancamentoTipo" AS ENUM ('RECEITA', 'DESPESA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "LancamentoStatus" AS ENUM ('EM_ABERTO', 'QUITADO');

-- CreateEnum
CREATE TYPE "CondicaoPagamento" AS ENUM ('A_VISTA', 'PARCELADO');

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "LancamentoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteId" TEXT,
    "fornecedorId" TEXT,
    "categoriaId" TEXT,
    "projetoId" TEXT,
    "jobId" TEXT,
    "centroCustoId" TEXT,
    "contaId" TEXT,
    "contaDestinoId" TEXT,
    "docNf" TEXT,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataCompetencia" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "dataFaturamento" TIMESTAMP(3),
    "valor" DECIMAL(14,2) NOT NULL,
    "acrescimos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "descontos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "condicao" "CondicaoPagamento" NOT NULL DEFAULT 'A_VISTA',
    "status" "LancamentoStatus" NOT NULL DEFAULT 'EM_ABERTO',
    "observacao" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lancamento_numero_key" ON "Lancamento"("numero");

-- CreateIndex
CREATE INDEX "Lancamento_tipo_idx" ON "Lancamento"("tipo");

-- CreateIndex
CREATE INDEX "Lancamento_status_idx" ON "Lancamento"("status");

-- CreateIndex
CREATE INDEX "Lancamento_dataCompetencia_idx" ON "Lancamento"("dataCompetencia");

-- CreateIndex
CREATE INDEX "Lancamento_dataVencimento_idx" ON "Lancamento"("dataVencimento");

-- CreateIndex
CREATE INDEX "Lancamento_clienteId_idx" ON "Lancamento"("clienteId");

-- CreateIndex
CREATE INDEX "Lancamento_fornecedorId_idx" ON "Lancamento"("fornecedorId");

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_contaDestinoId_fkey" FOREIGN KEY ("contaDestinoId") REFERENCES "ContaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
