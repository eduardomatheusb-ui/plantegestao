-- CreateTable
CREATE TABLE "JobStatus" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "cor" TEXT,
    "isConcluido" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "projetoId" TEXT,
    "responsavelId" TEXT,
    "statusId" TEXT NOT NULL,
    "prazo" TIMESTAMP(3),
    "briefing" TEXT,
    "concluidoEm" TIMESTAMP(3),
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTarefa" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavelId" TEXT,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTarefa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobStatus_ordem_idx" ON "JobStatus"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Job_numero_key" ON "Job"("numero");

-- CreateIndex
CREATE INDEX "Job_clienteId_idx" ON "Job"("clienteId");

-- CreateIndex
CREATE INDEX "Job_projetoId_idx" ON "Job"("projetoId");

-- CreateIndex
CREATE INDEX "Job_responsavelId_idx" ON "Job"("responsavelId");

-- CreateIndex
CREATE INDEX "Job_statusId_idx" ON "Job"("statusId");

-- CreateIndex
CREATE INDEX "Job_arquivado_idx" ON "Job"("arquivado");

-- CreateIndex
CREATE INDEX "JobTarefa_jobId_idx" ON "JobTarefa"("jobId");

-- CreateIndex
CREATE INDEX "Apontamento_jobId_idx" ON "Apontamento"("jobId");

-- AddForeignKey
ALTER TABLE "Apontamento" ADD CONSTRAINT "Apontamento_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "JobStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTarefa" ADD CONSTRAINT "JobTarefa_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTarefa" ADD CONSTRAINT "JobTarefa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
