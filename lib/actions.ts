"use server";
import { CartProduct } from "@/types";
import prisma from "./prisma";

type CurrentState = { success: boolean; error: boolean };

export const createCartItem = async (
  currentState: CurrentState,
  data: CartProduct
): Promise<CurrentState> => {
  try {
    await prisma.cartItem.create({
      data: {
        userId: data.userId,
        productId: data.id as string,
        name: data.name,
        slug: data.slug,
        image: data.image as string,
        price: data.price,
        quantity: data.quantity,
        size: data.size || null,
        color: data.color || null,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    return { success: false, error: true };
  }
};
