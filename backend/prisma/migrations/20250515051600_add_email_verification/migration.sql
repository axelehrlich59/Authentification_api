-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerificationExpires" DATETIME;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
