-- CreateEnum
CREATE TYPE "ReembolsoStatus" AS ENUM ('RASCUNHO', 'ENVIADO', 'PENDENTE_AJUSTE', 'APROVADO', 'REPROVADO', 'PROGRAMADO', 'PAGO');

-- AlterTable
ALTER TABLE "Lancamento" ADD COLUMN     "colaboradorId" TEXT;

-- CreateTable
CREATE TABLE "Reembolso" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "competenciaAno" INTEGER NOT NULL,
    "competenciaMes" INTEGER NOT NULL,
    "status" "ReembolsoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "observacaoSolicitante" TEXT,
    "analisadoPorId" TEXT,
    "analisadoEm" TIMESTAMP(3),
    "parecerFinanceiro" TEXT,
    "dataPrevistaPagamento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "lancamentoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reembolso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReembolsoDespesa" (
    "id" TEXT NOT NULL,
    "reembolsoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "formaPagamento" TEXT,
    "clienteId" TEXT,
    "projetoId" TEXT,
    "jobId" TEXT,
    "centroCustoId" TEXT,
    "repassavelCliente" BOOLEAN NOT NULL DEFAULT false,
    "autorizadoPor" TEXT,
    "aprovada" BOOLEAN,
    "parecerItem" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReembolsoDespesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reembolso_numero_key" ON "Reembolso"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Reembolso_lancamentoId_key" ON "Reembolso"("lancamentoId");

-- CreateIndex
CREATE INDEX "Reembolso_solicitanteId_idx" ON "Reembolso"("solicitanteId");

-- CreateIndex
CREATE INDEX "Reembolso_status_idx" ON "Reembolso"("status");

-- CreateIndex
CREATE INDEX "Reembolso_competenciaAno_competenciaMes_idx" ON "Reembolso"("competenciaAno", "competenciaMes");

-- CreateIndex
CREATE INDEX "ReembolsoDespesa_reembolsoId_idx" ON "ReembolsoDespesa"("reembolsoId");

-- CreateIndex
CREATE INDEX "ReembolsoDespesa_clienteId_idx" ON "ReembolsoDespesa"("clienteId");

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reembolso" ADD CONSTRAINT "Reembolso_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reembolso" ADD CONSTRAINT "Reembolso_analisadoPorId_fkey" FOREIGN KEY ("analisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reembolso" ADD CONSTRAINT "Reembolso_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReembolsoDespesa" ADD CONSTRAINT "ReembolsoDespesa_reembolsoId_fkey" FOREIGN KEY ("reembolsoId") REFERENCES "Reembolso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReembolsoDespesa" ADD CONSTRAINT "ReembolsoDespesa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReembolsoDespesa" ADD CONSTRAINT "ReembolsoDespesa_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReembolsoDespesa" ADD CONSTRAINT "ReembolsoDespesa_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReembolsoDespesa" ADD CONSTRAINT "ReembolsoDespesa_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "CentroCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

