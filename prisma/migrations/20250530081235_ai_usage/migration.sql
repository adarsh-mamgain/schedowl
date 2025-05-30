/*
  Warnings:

  - You are about to drop the column `features` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "features",
ADD COLUMN     "aiUsageDate" TIMESTAMP(3),
ADD COLUMN     "aiUsageToday" INTEGER NOT NULL DEFAULT 100;
