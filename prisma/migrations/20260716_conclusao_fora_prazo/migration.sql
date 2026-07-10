-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "concluidoForaPrazo" BOOLEAN;

-- AlterTable
ALTER TABLE "Projeto" ADD COLUMN     "concluidoEm" TIMESTAMP(3),
ADD COLUMN     "concluidoForaPrazo" BOOLEAN;

