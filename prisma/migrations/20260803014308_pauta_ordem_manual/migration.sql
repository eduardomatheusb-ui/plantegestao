-- CreateTable
CREATE TABLE "PautaOrdem" (
    "usuarioId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "PautaOrdem_pkey" PRIMARY KEY ("usuarioId","jobId")
);

-- CreateIndex
CREATE INDEX "PautaOrdem_usuarioId_idx" ON "PautaOrdem"("usuarioId");

-- AddForeignKey
ALTER TABLE "PautaOrdem" ADD CONSTRAINT "PautaOrdem_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PautaOrdem" ADD CONSTRAINT "PautaOrdem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
