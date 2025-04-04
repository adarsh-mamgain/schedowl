-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'PROCESSING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'RENEWED', 'ON_HOLD', 'PAUSED', 'CANCELLED', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "features" JSONB NOT NULL DEFAULT '{"maxWorkspaces":1,"maxSocialAccounts":1,"aiTokens":200,"canSchedule":true,"canUseAI":false,"canUseAnalytics":false}';

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL,
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscriptionId_key" ON "subscriptions"("subscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_subscriptionId_idx" ON "subscriptions"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentId_key" ON "payments"("paymentId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_paymentId_idx" ON "payments"("paymentId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("subscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
