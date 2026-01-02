/*
  Warnings:

  - You are about to drop the column `stripePaymentIntentId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `stripeRefundId` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "stripePaymentIntentId",
DROP COLUMN "stripeRefundId",
ADD COLUMN     "paystackReference" TEXT;
