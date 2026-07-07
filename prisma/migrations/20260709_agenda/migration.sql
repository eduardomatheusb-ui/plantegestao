-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "agendaIcsToken" TEXT;

-- CreateTable
CREATE TABLE "Compromisso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'reuniao',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "diaInteiro" BOOLEAN NOT NULL DEFAULT false,
    "local" TEXT,
    "descricao" TEXT,
    "clienteId" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compromisso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompromissoParticipante" (
    "compromissoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "CompromissoParticipante_pkey" PRIMARY KEY ("compromissoId","usuarioId")
);

-- CreateIndex
CREATE INDEX "Compromisso_inicio_idx" ON "Compromisso"("inicio");

-- CreateIndex
CREATE INDEX "CompromissoParticipante_usuarioId_idx" ON "CompromissoParticipante"("usuarioId");

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compromisso" ADD CONSTRAINT "Compromisso_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompromissoParticipante" ADD CONSTRAINT "CompromissoParticipante_compromissoId_fkey" FOREIGN KEY ("compromissoId") REFERENCES "Compromisso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompromissoParticipante" ADD CONSTRAINT "CompromissoParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

