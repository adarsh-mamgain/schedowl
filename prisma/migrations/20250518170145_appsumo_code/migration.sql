-- CreateEnum
CREATE TYPE "AppSumoCodeStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'REVOKED');

-- CreateTable
CREATE TABLE "appsumo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AppSumoCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appsumo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appsumo_codes_code_key" ON "appsumo_codes"("code");

-- CreateIndex
CREATE INDEX "appsumo_codes_code_idx" ON "appsumo_codes"("code");

-- CreateIndex
CREATE INDEX "appsumo_codes_userId_idx" ON "appsumo_codes"("userId");

-- AddForeignKey
ALTER TABLE "appsumo_codes" ADD CONSTRAINT "appsumo_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
