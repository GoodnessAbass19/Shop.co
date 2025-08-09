/*
  Warnings:

  - A unique constraint covering the columns `[contactEmail]` on the table `Store` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'RIDER';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_contactEmail_key" ON "Store"("contactEmail");
