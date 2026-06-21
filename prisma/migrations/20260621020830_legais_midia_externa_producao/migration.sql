-- CreateEnum
CREATE TYPE "ProducaoStatus" AS ENUM ('EM_ABERTO', 'ENVIADA', 'APROVADA', 'REPROVADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "contatoNome" TEXT,
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "inscricaoMunicipal" TEXT;

-- AlterTable
ALTER TABLE "Fornecedor" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "inscricaoMunicipal" TEXT,
ADD COLUMN     "razaoSocial" TEXT;

-- AlterTable
ALTER TABLE "MidiaGradeLinha" ADD COLUMN     "desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "local" TEXT,
ADD COLUMN     "periodoFim" TIMESTAMP(3),
ADD COLUMN     "periodoInicio" TIMESTAMP(3),
ADD COLUMN     "produto" TEXT,
ADD COLUMN     "quantidade" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MidiaPlano" ADD COLUMN     "formaPagamento" TEXT,
ADD COLUMN     "vencimento" TIMESTAMP(3),
ADD COLUMN     "versao" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Veiculo" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "documento" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "inscricaoMunicipal" TEXT,
ADD COLUMN     "razaoSocial" TEXT;

-- CreateTable
CREATE TABLE "ProducaoOrdem" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "titulo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "projetoId" TEXT,
    "fornecedorId" TEXT,
    "responsavelId" TEXT,
    "dataEntrega" TIMESTAMP(3),
    "vencimento" TIMESTAMP(3),
    "formaPagamento" TEXT,
    "comissaoPct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "valorTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "ProducaoStatus" NOT NULL DEFAULT 'EM_ABERTO',
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProducaoOrdem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProducaoItem" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "titulo" TEXT NOT NULL,
    "quantidade" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "valorUnit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProducaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProducaoOrdem_numero_key" ON "ProducaoOrdem"("numero");

-- CreateIndex
CREATE INDEX "ProducaoOrdem_clienteId_idx" ON "ProducaoOrdem"("clienteId");

-- CreateIndex
CREATE INDEX "ProducaoOrdem_status_idx" ON "ProducaoOrdem"("status");

-- CreateIndex
CREATE INDEX "ProducaoItem_ordemId_idx" ON "ProducaoItem"("ordemId");

-- AddForeignKey
ALTER TABLE "ProducaoOrdem" ADD CONSTRAINT "ProducaoOrdem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoOrdem" ADD CONSTRAINT "ProducaoOrdem_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoOrdem" ADD CONSTRAINT "ProducaoOrdem_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoOrdem" ADD CONSTRAINT "ProducaoOrdem_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoItem" ADD CONSTRAINT "ProducaoItem_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ProducaoOrdem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
