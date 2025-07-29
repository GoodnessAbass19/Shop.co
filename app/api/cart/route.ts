// app/api/cart/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Your custom auth function

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        cartItems: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    slug: true,
                    price: true, // Include base product price for calculation reference
                    discounts: {
                      // Include discounts related to the product
                      where: {
                        expiresAt: {
                          gte: new Date(), // Only include active discounts
                        },
                        startsAt: {
                          lte: new Date(), // Only include discounts that have started
                        },
                      },
                      orderBy: {
                        percentage: "desc", // Order by percentage to easily pick best
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json(
        { cart: { userId: user.id, cartItems: [] } },
        { status: 200 }
      );
    }

    let totalDiscountAmount = 0;
    const processedCartItems = cart.cartItems.map((item) => {
      const product = item.productVariant.product;
      const variantPrice = item.productVariant.price;
      let itemDiscount = 0;

      // Calculate discount for the current cart item
      if (product.discounts && product.discounts.length > 0) {
        const applicableDiscounts = product.discounts;

        // Simple strategy: apply the single highest discount percentage if not combinable
        // Or sum percentages for combinable ones (though combining percentages can be tricky, often it's "max discount")
        // For simplicity, let's apply the highest *single* discount for the product.
        // A more complex system would handle specific coupon codes, etc.

        // Find the best single discount percentage for this product
        let bestDiscountPercentage = 0;
        for (const discount of applicableDiscounts) {
          // Note: If you have "canBeCombined" logic, you'd implement it more sophisticatedly here.
          // For now, we'll just pick the single best percentage if multiple exist for a product.
          if (discount.percentage! > bestDiscountPercentage!) {
            bestDiscountPercentage = discount.percentage!;
          }
        }

        itemDiscount =
          ((variantPrice * bestDiscountPercentage) / 100) * item.quantity;
      }

      totalDiscountAmount += itemDiscount;

      // Return cart item with calculated discount for easier frontend rendering
      return {
        ...item,
        calculatedItemDiscount: itemDiscount,
      };
    });

    return NextResponse.json(
      {
        cart: {
          ...cart,
          cartItems: processedCartItems,
        },
        totalDiscountAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching cart details:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
