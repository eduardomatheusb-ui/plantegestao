-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "portalSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_portalSlug_key" ON "Cliente"("portalSlug");

