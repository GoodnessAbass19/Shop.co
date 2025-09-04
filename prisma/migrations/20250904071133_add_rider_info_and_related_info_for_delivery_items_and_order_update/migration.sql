/*
  Warnings:

  - You are about to drop the column `assignedAt` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryCode` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `riderName` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `riderPhone` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `trackingUrl` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeliveryStatus" ADD VALUE 'READY_FOR_PICKUP';
ALTER TYPE "DeliveryStatus" ADD VALUE 'FAILED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'RETURN_REQUESTED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'RETURN_APPROVED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'RETURN_IN_TRANSIT';
ALTER TYPE "DeliveryStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "assignedAt",
DROP COLUMN "deliveryCode",
DROP COLUMN "riderName",
DROP COLUMN "riderPhone",
DROP COLUMN "trackingUrl";

-- CreateTable
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "riderId" TEXT,
    "codeHash" TEXT,
    "codeExpiresAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryItem_orderItemId_key" ON "DeliveryItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_phone_key" ON "Rider"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_userId_key" ON "Rider"("userId");

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
