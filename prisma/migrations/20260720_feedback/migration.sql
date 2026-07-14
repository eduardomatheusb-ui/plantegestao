-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'erro',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "pagina" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "autorId" TEXT,
    "resposta" TEXT,
    "respondidoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");

-- CreateIndex
CREATE INDEX "Feedback_tipo_idx" ON "Feedback"("tipo");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_respondidoPorId_fkey" FOREIGN KEY ("respondidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

