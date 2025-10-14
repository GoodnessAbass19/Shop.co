-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_assignedRiderId_fkey" FOREIGN KEY ("assignedRiderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
