-- AlterTable
ALTER TABLE "Rider" ADD COLUMN     "penaltyCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reliabilityScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "suspensionUntil" TIMESTAMP(3);
