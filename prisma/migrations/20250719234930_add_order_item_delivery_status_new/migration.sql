/*
  Warnings:

  - The values [ASSIGNED,IN_TRANSIT,FAILED] on the enum `DeliveryStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryStatus_new" AS ENUM ('PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED');
ALTER TABLE "OrderItem" ALTER COLUMN "deliveryStatus" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "deliveryStatus" TYPE "DeliveryStatus_new" USING ("deliveryStatus"::text::"DeliveryStatus_new");
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
ALTER TYPE "DeliveryStatus_new" RENAME TO "DeliveryStatus";
DROP TYPE "DeliveryStatus_old";
ALTER TABLE "OrderItem" ALTER COLUMN "deliveryStatus" SET DEFAULT 'PENDING';
COMMIT;
