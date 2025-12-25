/*
  Warnings:

  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[tokenHash]` on the table `OtpToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sellerSku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Made the column `subSubCategoryId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `quantity` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerSku` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variation` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SpecInputType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'RICHTEXT');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_subSubCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropIndex
DROP INDEX "ProductVariant_sku_key";

-- AlterTable
ALTER TABLE "OtpToken" ADD COLUMN     "tokenHash" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
DROP COLUMN "stock",
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "colorFamily" TEXT,
ADD COLUMN     "highlight" TEXT,
ALTER COLUMN "subSubCategoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "color",
DROP COLUMN "size",
DROP COLUMN "sku",
DROP COLUMN "stock",
ADD COLUMN     "gtinBarcode" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "saleEndDate" TIMESTAMP(3),
ADD COLUMN     "salePrice" DECIMAL(10,2),
ADD COLUMN     "saleStartDate" TIMESTAMP(3),
ADD COLUMN     "sellerSku" TEXT NOT NULL,
ADD COLUMN     "variation" TEXT NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ALTER COLUMN "banner" DROP NOT NULL,
ALTER COLUMN "banner" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "ProductSpecification" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "specificationId" TEXT NOT NULL,

    CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "inputType" "SpecInputType" NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "SpecificationDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSpecification_productId_specificationId_key" ON "ProductSpecification"("productId", "specificationId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationDefinition_name_categoryId_key" ON "SpecificationDefinition"("name", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_tokenHash_key" ON "OtpToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sellerSku_key" ON "ProductVariant"("sellerSku");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subSubCategoryId_fkey" FOREIGN KEY ("subSubCategoryId") REFERENCES "SubSubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpecification" ADD CONSTRAINT "ProductSpecification_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "SpecificationDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationDefinition" ADD CONSTRAINT "SpecificationDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
