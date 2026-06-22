-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "aprovacaoEm" TIMESTAMP(3),
ADD COLUMN     "aprovacaoStatus" TEXT NOT NULL DEFAULT 'rascunho',
ADD COLUMN     "aprovacaoToken" TEXT;

-- CreateTable
CREATE TABLE "AprovacaoEvento" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "autor" TEXT,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AprovacaoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AprovacaoEvento_jobId_idx" ON "AprovacaoEvento"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_aprovacaoToken_key" ON "Job"("aprovacaoToken");

-- AddForeignKey
ALTER TABLE "AprovacaoEvento" ADD CONSTRAINT "AprovacaoEvento_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

