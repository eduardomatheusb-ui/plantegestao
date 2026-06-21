-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('NENHUM', 'VER', 'EDITAR', 'ADMIN');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "conviteExpira" TIMESTAMP(3),
ADD COLUMN     "conviteToken" TEXT,
ADD COLUMN     "perfilId" TEXT,
ADD COLUMN     "responsavelConta" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "senhaHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PerfilAcesso" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilCapacidade" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "nivel" "NivelAcesso" NOT NULL DEFAULT 'NENHUM',

    CONSTRAINT "PerfilCapacidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilAcesso_nome_key" ON "PerfilAcesso"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilCapacidade_perfilId_modulo_key" ON "PerfilCapacidade"("perfilId", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_conviteToken_key" ON "Usuario"("conviteToken");

-- AddForeignKey
ALTER TABLE "PerfilCapacidade" ADD CONSTRAINT "PerfilCapacidade_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "PerfilAcesso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "PerfilAcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
