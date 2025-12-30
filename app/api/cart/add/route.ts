// app/api/cart/add/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Your custom auth function to get the current user

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productVariantId, quantity } = await request.json();

    if (!productVariantId || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { error: "Product variant ID and a positive quantity are required." },
        { status: 400 }
      );
    }

    // 1. Find or create the user's cart
    let userCart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // 2. Check if the item already exists in the cart for this variant
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: userCart.id,
        productVariantId: productVariantId,
      },
      include: {
        productVariant: {
          // Include productVariant to check stock
          select: { quantity: true },
        },
      },
    });

    // 3. Check stock availability
    const productVariant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      select: {
        quantity: true,
        productId: true,
        product: {
          include: {
            store: true,
          },
        },
      }, // Select productId to link to product
    });

    if (!productVariant) {
      return NextResponse.json(
        { error: "Product variant not found." },
        { status: 404 }
      );
    }

    const newTotalQuantity = (existingCartItem?.quantity || 0) + quantity;

    if (newTotalQuantity > productVariant.quantity) {
      return NextResponse.json(
        {
          error: `Not enough quantity. Only ${productVariant.quantity} available for this variant.`,
        },
        { status: 400 }
      );
    }

    let cartItem;
    if (existingCartItem) {
      // If item exists, update its quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newTotalQuantity },
      });
      console.log(
        `Updated cart item ${cartItem.id} quantity to ${cartItem.quantity}`
      );
    } else {
      // If item doesn't exist, create a new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productVariantId: productVariantId,
          quantity: quantity,
        },
      });
      console.log(`Created new cart item ${cartItem.id}`);
    }

    return NextResponse.json({ success: true, cartItem }, { status: 200 });
  } catch (error) {
    console.error("API Error adding item to cart:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
