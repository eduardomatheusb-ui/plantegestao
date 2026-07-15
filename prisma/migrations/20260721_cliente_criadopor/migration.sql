-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "criadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

