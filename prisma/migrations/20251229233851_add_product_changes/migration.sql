/*
  Warnings:

  - You are about to drop the column `variantType` on the `ProductVariant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InfoStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'BUSINESS_CERTIFICATE', 'TAX_DOCUMENT', 'PROOF_OF_ADDRESS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StoreStatus" ADD VALUE 'PENDING_VERIFICATION';
ALTER TYPE "StoreStatus" ADD VALUE 'REJECTED';

-- AlterEnum
ALTER TYPE "VariantType" ADD VALUE 'SIZE_SHOE';

-- DropIndex
DROP INDEX "ProductVariant_variantType_idx";

-- AlterTable
ALTER TABLE "BusinessInfo" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "status" "InfoStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "variantType",
ADD COLUMN     "colorAvailable" TEXT[],
ADD COLUMN     "drinkSize" TEXT,
ADD COLUMN     "volume" TEXT;

-- AlterTable
ALTER TABLE "ShippingInfo" ADD COLUMN     "status" "InfoStatus" NOT NULL DEFAULT 'PENDING';



-- AlterTable
ALTER TABLE "SubSubCategory" ADD COLUMN     "productVariantType" "VariantType" NOT NULL DEFAULT 'VARIATION';

-- CreateTable
CREATE TABLE "BusinessDocument" (
    "id" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessDocument_kycId_idx" ON "BusinessDocument"("kycId");

-- AddForeignKey
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "BusinessDocument_kycId_fkey" FOREIGN KEY ("kycId") REFERENCES "BusinessInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
