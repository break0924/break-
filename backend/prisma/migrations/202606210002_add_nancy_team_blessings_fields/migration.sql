-- CreateEnum
CREATE TYPE "ChatSenderType" AS ENUM ('USER', 'SYSTEM', 'TEAM');

-- AlterTable
ALTER TABLE "chat_messages"
ADD COLUMN "senderType" "ChatSenderType" NOT NULL DEFAULT 'USER',
ADD COLUMN "messageType" TEXT NOT NULL DEFAULT 'USER_MESSAGE',
ADD COLUMN "teamName" TEXT,
ADD COLUMN "teamCode" TEXT,
ADD COLUMN "flagUrl" TEXT,
ADD COLUMN "batchKey" TEXT;

-- CreateIndex
CREATE INDEX "chat_messages_batchKey_idx" ON "chat_messages"("batchKey");

-- CreateIndex
CREATE UNIQUE INDEX "chat_messages_batchKey_teamCode_key" ON "chat_messages"("batchKey", "teamCode");
