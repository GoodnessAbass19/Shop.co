-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LOW_STOCK_THRESHOLD';
ALTER TYPE "NotificationType" ADD VALUE 'OUT_OF_STOCK';
ALTER TYPE "NotificationType" ADD VALUE 'PRODUCT_REVIEW_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'RETURN_PROCESSED_SELLER_SIDE';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CANCELLED_BY_BUYER';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CONFIRMATION';
ALTER TYPE "NotificationType" ADD VALUE 'SHIPPING_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE 'REFUND_PROCESSED_BUYER_SIDE';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CANCELLED_BY_SELLER';
