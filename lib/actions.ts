"use server";
import { CartProduct } from "@/types";
import prisma from "./prisma";

type CurrentState = { success: boolean; error: boolean };

export const createCartItem = async (currentState: CurrentState, data: any) => {
  console.log(data);
  try {
    await prisma.cartItem.create({
      data: {
        userId: data.userId,
        productId: data.id,
        name: data.name,
        slug: data.slug,
        image: data.image as string,
        price: data.price,
        quantity: data.quantity,
        size: data.size || null,
        color: data.color || null,
      },
    });
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateCartItem = async (currentState: CurrentState, data: any) => {
  console.log(data);
  try {
    // Find existing cart item
    const existingCartItem = await prisma.cartItem.findFirst({
      where: { userId: data.userId, productId: data.productId },
    });

    if (!existingCartItem) {
      return { success: false, message: "Cart item not found" };
    }

    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: data.quantity,
      },
    });
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
