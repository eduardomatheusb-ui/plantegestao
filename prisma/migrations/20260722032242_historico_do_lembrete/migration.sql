-- CreateTable
CREATE TABLE "LembreteHistorico" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "dia" TIMESTAMP(3) NOT NULL,
    "pendencias" INTEGER NOT NULL,
    "postagensMarcadas" INTEGER NOT NULL DEFAULT 0,
    "postagensTotal" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LembreteHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LembreteHistorico_usuarioId_dia_idx" ON "LembreteHistorico"("usuarioId", "dia");

-- CreateIndex
CREATE UNIQUE INDEX "LembreteHistorico_usuarioId_dia_key" ON "LembreteHistorico"("usuarioId", "dia");

-- AddForeignKey
ALTER TABLE "LembreteHistorico" ADD CONSTRAINT "LembreteHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
