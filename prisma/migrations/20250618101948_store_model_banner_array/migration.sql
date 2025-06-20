/*
  Warnings:

  - The `banner` column on the `Store` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Store" DROP COLUMN "banner",
ADD COLUMN     "banner" TEXT[];
