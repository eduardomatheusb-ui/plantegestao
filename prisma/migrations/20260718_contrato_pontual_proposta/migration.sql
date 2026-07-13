-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "propostaId" TEXT,
ADD COLUMN     "servico" TEXT,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'recorrente',
ADD COLUMN     "valorTotal" DECIMAL(14,2),
ALTER COLUMN "valorMensal" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lancamento" ADD COLUMN     "propostaId" TEXT;

