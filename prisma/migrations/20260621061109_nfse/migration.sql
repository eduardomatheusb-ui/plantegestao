-- CreateEnum
CREATE TYPE "NfStatus" AS ENUM ('PROCESSANDO', 'AUTORIZADA', 'ERRO', 'CANCELADA');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "aliquotaIss" DECIMAL(6,4),
ADD COLUMN     "codigoMunicipioIbge" TEXT,
ADD COLUMN     "codigoTributarioMunicipio" TEXT,
ADD COLUMN     "incentivadorCultural" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inscricaoMunicipal" TEXT,
ADD COLUMN     "itemListaServico" TEXT,
ADD COLUMN     "optanteSimplesNacional" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "regimeTributario" TEXT;

-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "osId" TEXT,
    "lancamentoId" TEXT,
    "clienteId" TEXT NOT NULL,
    "status" "NfStatus" NOT NULL DEFAULT 'PROCESSANDO',
    "numero" TEXT,
    "codigoVerificacao" TEXT,
    "valor" DECIMAL(14,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "urlPdf" TEXT,
    "urlXml" TEXT,
    "mensagemErro" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_ref_key" ON "NotaFiscal"("ref");

-- CreateIndex
CREATE INDEX "NotaFiscal_osId_idx" ON "NotaFiscal"("osId");

-- CreateIndex
CREATE INDEX "NotaFiscal_clienteId_idx" ON "NotaFiscal"("clienteId");

-- CreateIndex
CREATE INDEX "NotaFiscal_status_idx" ON "NotaFiscal"("status");

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "Lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

