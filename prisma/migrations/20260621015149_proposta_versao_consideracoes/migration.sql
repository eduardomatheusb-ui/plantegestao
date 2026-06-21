-- AlterTable
ALTER TABLE "Proposta" ADD COLUMN     "consideracoesFinais" TEXT,
ADD COLUMN     "versao" INTEGER NOT NULL DEFAULT 1;
