/*
  Warnings:

  - Added the required column `city` to the `CustomerCare` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerCare" ADD COLUMN     "city" TEXT NOT NULL;
