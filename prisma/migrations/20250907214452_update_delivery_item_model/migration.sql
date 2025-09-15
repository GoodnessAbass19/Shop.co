/*
  Warnings:

  - You are about to drop the column `codeExpiresAt` on the `DeliveryItem` table. All the data in the column will be lost.
  - You are about to drop the column `codeHash` on the `DeliveryItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeliveryItem" DROP COLUMN "codeExpiresAt",
DROP COLUMN "codeHash",
ADD COLUMN     "deliveryCodeExpires" TIMESTAMP(3),
ADD COLUMN     "deliveryCodeHash" TEXT,
ADD COLUMN     "pickupCodeExpires" TIMESTAMP(3),
ADD COLUMN     "pickupCodeHash" TEXT,
ADD COLUMN     "sellerGeohash" TEXT,
ADD COLUMN     "sellerLat" DOUBLE PRECISION,
ADD COLUMN     "sellerLng" DOUBLE PRECISION,
ADD COLUMN     "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING';
