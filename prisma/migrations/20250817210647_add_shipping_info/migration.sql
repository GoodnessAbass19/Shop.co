-- CreateTable
CREATE TABLE "ShippingInfo" (
    "id" TEXT NOT NULL,
    "shippingZone" TEXT NOT NULL,
    "shippingAddress1" TEXT NOT NULL,
    "shippingAddress2" TEXT,
    "shippingCity" TEXT NOT NULL,
    "shippingState" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "shippingPostalCode" TEXT,
    "returnAddress1" TEXT NOT NULL,
    "returnAddress2" TEXT,
    "returnCity" TEXT NOT NULL,
    "returnState" TEXT NOT NULL,
    "returnCountry" TEXT NOT NULL,
    "returnPostalCode" TEXT,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "ShippingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingInfo_storeId_key" ON "ShippingInfo"("storeId");

-- AddForeignKey
ALTER TABLE "ShippingInfo" ADD CONSTRAINT "ShippingInfo_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
