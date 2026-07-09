-- CreateTable
CREATE TABLE "JobTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'post_estatico',
    "prioridade" TEXT NOT NULL DEFAULT 'normal',
    "responsavelId" TEXT,
    "briefing" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTemplateTarefa" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "responsavelId" TEXT,
    "prazoRelativoDias" INTEGER,

    CONSTRAINT "JobTemplateTarefa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobTemplateTarefa_templateId_idx" ON "JobTemplateTarefa"("templateId");

-- AddForeignKey
ALTER TABLE "JobTemplateTarefa" ADD CONSTRAINT "JobTemplateTarefa_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "JobTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

