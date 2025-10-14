/*
  Warnings:

  - You are about to drop the column `assignedRiderId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `pickUpGeohash` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `pickUpLat` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `pickUpLng` on the `OrderItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_assignedRiderId_fkey";

-- AlterTable
ALTER TABLE "DeliveryItem" ADD COLUMN     "deliveryDeadline" TIMESTAMP(3),
ADD COLUMN     "pickupDeadline" TIMESTAMP(3),
ADD COLUMN     "reofferedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "assignedRiderId",
DROP COLUMN "pickUpGeohash",
DROP COLUMN "pickUpLat",
DROP COLUMN "pickUpLng";
