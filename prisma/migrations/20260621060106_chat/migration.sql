-- CreateTable
CREATE TABLE "ChatMensagem" (
    "id" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatLeitura" (
    "usuarioId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "ultimaLidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatLeitura_pkey" PRIMARY KEY ("usuarioId","canal")
);

-- CreateIndex
CREATE INDEX "ChatMensagem_canal_criadoEm_idx" ON "ChatMensagem"("canal", "criadoEm");

-- AddForeignKey
ALTER TABLE "ChatMensagem" ADD CONSTRAINT "ChatMensagem_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatLeitura" ADD CONSTRAINT "ChatLeitura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

