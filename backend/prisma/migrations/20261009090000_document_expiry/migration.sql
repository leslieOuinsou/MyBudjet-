-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'document';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "expiryRemindedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");
