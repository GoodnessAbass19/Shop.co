-- AlterTable
ALTER TABLE "DeliveryItem" ADD COLUMN     "currentGeohash" TEXT,
ADD COLUMN     "currentLat" DOUBLE PRECISION,
ADD COLUMN     "currentLng" DOUBLE PRECISION,
ADD COLUMN     "offerExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBuyer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRider" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSeller" BOOLEAN NOT NULL DEFAULT false;
