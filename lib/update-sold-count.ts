// /lib/orders/updateSoldCount.ts
import prisma from "@/lib/prisma";

export async function updateProductSoldCount(
  productId: string,
  quantity: number
) {
  await prisma.product.update({
    where: { id: productId },
    data: {
      soldCount: {
        increment: quantity, // in case user bought multiple units
      },
    },
  });
}
