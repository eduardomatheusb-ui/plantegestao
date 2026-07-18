-- CreateTable
CREATE TABLE "TipoJobFluxo" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "etapas" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoJobFluxo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoJobArea" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "funcoes" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoJobArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoJobFluxo_tipo_key" ON "TipoJobFluxo"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoJobArea_tipo_key" ON "TipoJobArea"("tipo");

-- CreateIndex
CREATE INDEX "TipoJobArea_tipo_idx" ON "TipoJobArea"("tipo");

