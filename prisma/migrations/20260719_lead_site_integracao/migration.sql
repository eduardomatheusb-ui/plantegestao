-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "consentEm" TIMESTAMP(3),
ADD COLUMN     "consentLgpd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentTexto" TEXT,
ADD COLUMN     "interesse" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_telefone_idx" ON "Lead"("telefone");

