-- CreateEnum
CREATE TYPE "JobTipo" AS ENUM ('JOB', 'POSTAGEM');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "formatos" TEXT,
ADD COLUMN     "legenda" TEXT,
ADD COLUMN     "prazoPostagem" TIMESTAMP(3),
ADD COLUMN     "tipo" "JobTipo" NOT NULL DEFAULT 'JOB';

-- CreateTable
CREATE TABLE "JobEnvolvido" (
    "jobId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "JobEnvolvido_pkey" PRIMARY KEY ("jobId","usuarioId")
);

-- AddForeignKey
ALTER TABLE "JobEnvolvido" ADD CONSTRAINT "JobEnvolvido_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEnvolvido" ADD CONSTRAINT "JobEnvolvido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

