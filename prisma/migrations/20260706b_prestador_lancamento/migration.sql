-- AlterTable
ALTER TABLE "Lancamento" ADD COLUMN     "prestadorId" TEXT;

-- AddForeignKey
ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Prestador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

