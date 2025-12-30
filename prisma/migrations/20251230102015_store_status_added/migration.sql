-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

-- AlterTable
ALTER TABLE "SubSubCategory" ALTER COLUMN "productVariantType" DROP DEFAULT;
