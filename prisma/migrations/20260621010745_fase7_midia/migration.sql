-- CreateEnum
CREATE TYPE "MidiaStatus" AS ENUM ('EM_ABERTO', 'ENVIADA', 'APROVADA', 'REPROVADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "MidiaPlano" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "VeiculoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "projetoId" TEXT,
    "responsavelId" TEXT,
    "veiculoId" TEXT,
    "target" TEXT,
    "prazo" TIMESTAMP(3),
    "contatoVeiculo" TEXT,
    "rede" TEXT,
    "tipoRede" TEXT,
    "numOrcamento" TEXT,
    "comissaoPct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "honorarios" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "bonificacao" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "instrucoesFaturamento" TEXT,
    "valorTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "MidiaStatus" NOT NULL DEFAULT 'EM_ABERTO',
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MidiaPlano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MidiaPeca" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MidiaPeca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MidiaGrade" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "pracaNome" TEXT,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MidiaGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MidiaGradeLinha" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "pecaId" TEXT,
    "programaNome" TEXT,
    "formato" TEXT,
    "valorInsercao" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MidiaGradeLinha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MidiaInsercao" (
    "id" TEXT NOT NULL,
    "gradeLinhaId" TEXT NOT NULL,
    "dia" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "MidiaInsercao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MidiaPlano_numero_key" ON "MidiaPlano"("numero");

-- CreateIndex
CREATE INDEX "MidiaPlano_clienteId_idx" ON "MidiaPlano"("clienteId");

-- CreateIndex
CREATE INDEX "MidiaPlano_status_idx" ON "MidiaPlano"("status");

-- CreateIndex
CREATE INDEX "MidiaPlano_tipo_idx" ON "MidiaPlano"("tipo");

-- CreateIndex
CREATE INDEX "MidiaPeca_planoId_idx" ON "MidiaPeca"("planoId");

-- CreateIndex
CREATE INDEX "MidiaGrade_planoId_idx" ON "MidiaGrade"("planoId");

-- CreateIndex
CREATE INDEX "MidiaGradeLinha_gradeId_idx" ON "MidiaGradeLinha"("gradeId");

-- CreateIndex
CREATE INDEX "MidiaInsercao_gradeLinhaId_idx" ON "MidiaInsercao"("gradeLinhaId");

-- CreateIndex
CREATE UNIQUE INDEX "MidiaInsercao_gradeLinhaId_dia_key" ON "MidiaInsercao"("gradeLinhaId", "dia");

-- AddForeignKey
ALTER TABLE "MidiaPlano" ADD CONSTRAINT "MidiaPlano_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaPlano" ADD CONSTRAINT "MidiaPlano_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaPlano" ADD CONSTRAINT "MidiaPlano_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaPlano" ADD CONSTRAINT "MidiaPlano_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaPlano" ADD CONSTRAINT "MidiaPlano_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaPeca" ADD CONSTRAINT "MidiaPeca_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "MidiaPlano"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaGrade" ADD CONSTRAINT "MidiaGrade_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "MidiaPlano"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaGradeLinha" ADD CONSTRAINT "MidiaGradeLinha_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "MidiaGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaGradeLinha" ADD CONSTRAINT "MidiaGradeLinha_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "MidiaPeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MidiaInsercao" ADD CONSTRAINT "MidiaInsercao_gradeLinhaId_fkey" FOREIGN KEY ("gradeLinhaId") REFERENCES "MidiaGradeLinha"("id") ON DELETE CASCADE ON UPDATE CASCADE;
