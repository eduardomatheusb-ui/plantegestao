-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "escopo" TEXT,
ADD COLUMN     "linksUteis" TEXT,
ADD COLUMN     "redesSociais" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ativo',
ADD COLUMN     "tomDeVoz" TEXT;

