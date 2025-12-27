/*
  Warnings:

  - Added the required column `variantType` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('SIZE', 'VARIATION', 'DRINK_SIZE', 'VOLUME');

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "size" TEXT,
ADD COLUMN     "variantType" "VariantType" NOT NULL,
ALTER COLUMN "variation" DROP NOT NULL;
