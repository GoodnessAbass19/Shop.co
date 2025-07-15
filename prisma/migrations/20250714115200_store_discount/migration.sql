/*
  Warnings:

  - You are about to drop the column `canBeCombined` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Discount` table. All the data in the column will be lost.
  - Added the required column `startsAt` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Made the column `code` on table `Discount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expiresAt` on table `Discount` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Discount" DROP CONSTRAINT "Discount_productId_fkey";

-- AlterTable
ALTER TABLE "Discount" DROP COLUMN "canBeCombined",
DROP COLUMN "productId",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxDiscountAmount" DOUBLE PRECISION,
ADD COLUMN     "minOrderAmount" DOUBLE PRECISION,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "storeId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "percentage" DROP NOT NULL,
ALTER COLUMN "expiresAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "_DiscountToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DiscountToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DiscountToProduct_B_index" ON "_DiscountToProduct"("B");

-- CreateIndex
CREATE INDEX "Discount_storeId_idx" ON "Discount"("storeId");

-- CreateIndex
CREATE INDEX "Discount_code_idx" ON "Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_expiresAt_idx" ON "Discount"("expiresAt");

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscountToProduct" ADD CONSTRAINT "_DiscountToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscountToProduct" ADD CONSTRAINT "_DiscountToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
