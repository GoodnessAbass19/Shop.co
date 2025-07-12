-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3);
