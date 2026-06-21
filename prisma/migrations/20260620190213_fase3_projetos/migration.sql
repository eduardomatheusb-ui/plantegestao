-- CreateEnum
CREATE TYPE "ProjetoStatus" AS ENUM ('SEM_STATUS', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "status" "ProjetoStatus" NOT NULL DEFAULT 'SEM_STATUS',
    "prazoDesejado" TIMESTAMP(3),
    "prazoEstimado" TIMESTAMP(3),
    "budget" DECIMAL(14,2),
    "tempoEstimadoMin" INTEGER,
    "briefing" TEXT,
    "favorito" BOOLEAN NOT NULL DEFAULT false,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "projetoPaiId" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetoEnvolvido" (
    "projetoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetoEnvolvido_pkey" PRIMARY KEY ("projetoId","usuarioId")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "entidadeTipo" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "autorId" TEXT,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "entidadeTipo" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apontamento" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "projetoId" TEXT,
    "jobId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "minutos" INTEGER NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Apontamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_numero_key" ON "Projeto"("numero");

-- CreateIndex
CREATE INDEX "Projeto_clienteId_idx" ON "Projeto"("clienteId");

-- CreateIndex
CREATE INDEX "Projeto_status_idx" ON "Projeto"("status");

-- CreateIndex
CREATE INDEX "Projeto_arquivado_idx" ON "Projeto"("arquivado");

-- CreateIndex
CREATE INDEX "Projeto_projetoPaiId_idx" ON "Projeto"("projetoPaiId");

-- CreateIndex
CREATE INDEX "ProjetoEnvolvido_usuarioId_idx" ON "ProjetoEnvolvido"("usuarioId");

-- CreateIndex
CREATE INDEX "Comentario_entidadeTipo_entidadeId_idx" ON "Comentario"("entidadeTipo", "entidadeId");

-- CreateIndex
CREATE INDEX "Anexo_entidadeTipo_entidadeId_idx" ON "Anexo"("entidadeTipo", "entidadeId");

-- CreateIndex
CREATE INDEX "Apontamento_projetoId_idx" ON "Apontamento"("projetoId");

-- CreateIndex
CREATE INDEX "Apontamento_usuarioId_idx" ON "Apontamento"("usuarioId");

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_projetoPaiId_fkey" FOREIGN KEY ("projetoPaiId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoEnvolvido" ADD CONSTRAINT "ProjetoEnvolvido_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoEnvolvido" ADD CONSTRAINT "ProjetoEnvolvido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apontamento" ADD CONSTRAINT "Apontamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apontamento" ADD CONSTRAINT "Apontamento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
