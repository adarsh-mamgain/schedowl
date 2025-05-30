-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiUsageDate" TIMESTAMP(3),
ADD COLUMN     "aiUsageToday" INTEGER NOT NULL DEFAULT 100;
