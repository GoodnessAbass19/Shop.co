/*
  Warnings:

  - You are about to drop the column `riderName` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `riderPhone` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "riderName",
DROP COLUMN "riderPhone",
ADD COLUMN     "assignedRiderId" TEXT,
ADD COLUMN     "pickUpGeohash" TEXT;
