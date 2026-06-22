-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "totpAtivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpRecoveryCodes" TEXT,
ADD COLUMN     "totpSecret" TEXT;

