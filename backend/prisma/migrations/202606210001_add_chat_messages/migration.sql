-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('VISIBLE', 'BLOCKED', 'DELETED');

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "openid" TEXT,
    "userId" TEXT,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "content" TEXT NOT NULL,
    "status" "ChatMessageStatus" NOT NULL DEFAULT 'VISIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_messages_status_createdAt_idx" ON "chat_messages"("status", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_openid_createdAt_idx" ON "chat_messages"("openid", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_userId_createdAt_idx" ON "chat_messages"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
