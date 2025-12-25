/*
  Warnings:

  - Made the column `tokenHash` on table `OtpToken` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OtpToken" ALTER COLUMN "tokenHash" SET NOT NULL;
