-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "atendimentoId" TEXT,
ADD COLUMN     "estrategiaId" TEXT;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_estrategiaId_fkey" FOREIGN KEY ("estrategiaId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
