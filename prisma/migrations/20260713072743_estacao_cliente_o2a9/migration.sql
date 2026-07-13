-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "reajusteEm" TIMESTAMP(3),
ADD COLUMN     "reajusteObs" TEXT;

-- CreateTable
CREATE TABLE "ClienteDossie" (
    "clienteId" TEXT NOT NULL,
    "apresentacao" TEXT,
    "segmento" TEXT,
    "aprovadores" TEXT,
    "objetivosNegocio" TEXT,
    "objetivosComunicacao" TEXT,
    "publicoAlvo" TEXT,
    "produtosPrioritarios" TEXT,
    "diferenciais" TEXT,
    "concorrentes" TEXT,
    "posicionamento" TEXT,
    "canaisAtivos" TEXT,
    "restricoes" TEXT,
    "datasImportantes" TEXT,
    "historicoRelacao" TEXT,
    "antesDeProduzir" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteDossie_pkey" PRIMARY KEY ("clienteId")
);

-- CreateTable
CREATE TABLE "EscopoItem" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "quantidadeMensal" INTEGER NOT NULL,
    "unidade" TEXT NOT NULL DEFAULT 'un',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscopoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteAcesso" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "identificacao" TEXT,
    "ondeGuardado" TEXT,
    "quemTemAcesso" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanejamentoPeriodo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "objetivoPrincipal" TEXT,
    "pilares" TEXT,
    "produtosPrioritarios" TEXT,
    "datasImportantes" TEXT,
    "acoesOnline" TEXT,
    "acoesOffline" TEXT,
    "producaoAudiovisual" TEXT,
    "verbaMidia" DECIMAL(14,2),
    "indicadores" TEXT,
    "status" TEXT NOT NULL DEFAULT 'vigente',
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanejamentoPeriodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EscopoItem_clienteId_idx" ON "EscopoItem"("clienteId");

-- CreateIndex
CREATE INDEX "ClienteAcesso_clienteId_idx" ON "ClienteAcesso"("clienteId");

-- CreateIndex
CREATE INDEX "PlanejamentoPeriodo_clienteId_idx" ON "PlanejamentoPeriodo"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanejamentoPeriodo_clienteId_ano_mes_key" ON "PlanejamentoPeriodo"("clienteId", "ano", "mes");

-- AddForeignKey
ALTER TABLE "ClienteDossie" ADD CONSTRAINT "ClienteDossie_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscopoItem" ADD CONSTRAINT "EscopoItem_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteAcesso" ADD CONSTRAINT "ClienteAcesso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanejamentoPeriodo" ADD CONSTRAINT "PlanejamentoPeriodo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanejamentoPeriodo" ADD CONSTRAINT "PlanejamentoPeriodo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
