import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItemId = params.id;
    const { quantity } = await request.json();

    if (typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be a positive number." },
        { status: 400 }
      );
    }

    // Find the cart item and its associated product variant to check stock
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true, // Include cart to check ownership
        productVariant: true,
      },
    });

    if (!existingCartItem) {
      return NextResponse.json(
        { error: "Cart item not found." },
        { status: 404 }
      );
    }

    // Ensure the cart item belongs to the current user's cart
    if (existingCartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Cart item does not belong to user." },
        { status: 403 }
      );
    }

    // Check stock availability
    if (quantity > existingCartItem.productVariant.quantity) {
      return NextResponse.json(
        {
          error: `Not enough stock. Only ${existingCartItem.productVariant.quantity} available.`,
        },
        { status: 400 }
      );
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return NextResponse.json(updatedCartItem, { status: 200 });
  } catch (error) {
    console.error("API Error updating cart item quantity:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// --- NEW: DELETE method for removing cart items ---
export async function DELETE(
  request: Request, // NextRequest is not necessary here, standard Request works
  { params }: { params: { id: string } } // Access dynamic id parameter
) {
  try {
    const user = await getCurrentUser(); // Authenticate the user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItemId = params.id; // Get the cart item ID from the URL parameters

    // Find the cart item to ensure it exists and belongs to the current user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: {
          // Include the cart to check its userId
          select: { userId: true },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found." },
        { status: 404 }
      );
    }

    // Crucial security check: Ensure the item belongs to the authenticated user's cart
    if (cartItem.cart.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this cart item." },
        { status: 403 }
      );
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    console.log(`Cart item ${cartItemId} deleted by user ${user.id}`);
    return NextResponse.json(
      { success: true, message: "Cart item deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error deleting cart item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
