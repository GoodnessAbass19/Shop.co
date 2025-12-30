/*
  Warnings:

  - You are about to alter the column `price` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `salePrice` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - Made the column `salePrice` on table `ProductVariant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "salePrice" SET NOT NULL,
ALTER COLUMN "salePrice" SET DATA TYPE DOUBLE PRECISION;
