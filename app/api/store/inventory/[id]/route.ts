// app/api/seller/inventory/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } } // This 'id' can be Product ID or ProductVariant ID
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // The ID of the product or product variant
    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    const body = await request.json();
    const { newStock, type } = body; // 'type' will be 'product' or 'variant'

    if (
      newStock === undefined ||
      newStock < 0 ||
      !["product", "variant"].includes(type)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid data: newStock (non-negative number) and type ('product' or 'variant') are required.",
        },
        { status: 400 }
      );
    }

    let updatedItem;

    if (type === "product") {
      // Update main product stock
      const product = await prisma.product.findUnique({
        where: { id: id },
        select: { storeId: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found." },
          { status: 404 }
        );
      }

      const sellerStore = await prisma.store.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!sellerStore || product.storeId !== sellerStore.id) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this product." },
          { status: 403 }
        );
      }

      updatedItem = await prisma.product.update({
        where: { id: id },
        data: { stock: newStock },
      });
    } else if (type === "variant") {
      // Update product variant stock
      const variant = await prisma.productVariant.findUnique({
        where: { id: id },
        select: { productId: true },
      });

      if (!variant) {
        return NextResponse.json(
          { error: "Product variant not found." },
          { status: 404 }
        );
      }

      // Verify the parent product belongs to the seller's store
      const product = await prisma.product.findUnique({
        where: { id: variant.productId },
        select: { storeId: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Parent product not found for variant." },
          { status: 404 }
        );
      }

      const sellerStore = await prisma.store.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!sellerStore || product.storeId !== sellerStore.id) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this product variant." },
          { status: 403 }
        );
      }

      updatedItem = await prisma.productVariant.update({
        where: { id: id },
        data: { stock: newStock },
      });
    }

    return NextResponse.json(
      { message: "Stock updated successfully.", item: updatedItem },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { error: "Failed to update stock." },
      { status: 500 }
    );
  }
}
