-- AlterTable
ALTER TABLE "Anexo" ADD COLUMN     "blobKey" TEXT,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "tamanho" INTEGER,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'link',
ALTER COLUMN "url" DROP NOT NULL;

