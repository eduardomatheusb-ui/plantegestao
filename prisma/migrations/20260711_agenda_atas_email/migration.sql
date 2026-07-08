-- AlterTable
ALTER TABLE "Compromisso" ADD COLUMN     "emailsExternos" TEXT;

-- AlterTable
ALTER TABLE "Reuniao" ADD COLUMN     "compromissoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reuniao_compromissoId_key" ON "Reuniao"("compromissoId");

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_compromissoId_fkey" FOREIGN KEY ("compromissoId") REFERENCES "Compromisso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

