-- AlterTable
ALTER TABLE "Campanha" ADD COLUMN     "metaCpl" DECIMAL(14,2),
ADD COLUMN     "metaLeads" INTEGER;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "prazoPostagemOriginal" TIMESTAMP(3),
ADD COLUMN     "publicadoEm" TIMESTAMP(3),
ADD COLUMN     "remarcacoesPostagem" INTEGER NOT NULL DEFAULT 0;

