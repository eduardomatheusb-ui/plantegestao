-- AlterTable
ALTER TABLE "Anexo" ADD COLUMN     "atual" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "versao" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "lookerEmbedUrl" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "linkPublicado" TEXT;

-- CreateTable
CREATE TABLE "AprovacaoLote" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "titulo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradoEm" TIMESTAMP(3),

    CONSTRAINT "AprovacaoLote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AprovacaoLoteItem" (
    "loteId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "decisao" TEXT,
    "comentario" TEXT,
    "respondidoEm" TIMESTAMP(3),
    "autorNome" TEXT,

    CONSTRAINT "AprovacaoLoteItem_pkey" PRIMARY KEY ("loteId","jobId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AprovacaoLote_token_key" ON "AprovacaoLote"("token");

-- CreateIndex
CREATE INDEX "AprovacaoLote_clienteId_idx" ON "AprovacaoLote"("clienteId");

-- CreateIndex
CREATE INDEX "AprovacaoLote_status_idx" ON "AprovacaoLote"("status");

-- CreateIndex
CREATE INDEX "AprovacaoLoteItem_jobId_idx" ON "AprovacaoLoteItem"("jobId");

-- AddForeignKey
ALTER TABLE "AprovacaoLote" ADD CONSTRAINT "AprovacaoLote_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprovacaoLote" ADD CONSTRAINT "AprovacaoLote_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprovacaoLoteItem" ADD CONSTRAINT "AprovacaoLoteItem_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "AprovacaoLote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprovacaoLoteItem" ADD CONSTRAINT "AprovacaoLoteItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
