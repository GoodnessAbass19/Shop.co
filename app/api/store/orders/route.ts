import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the store owned by the current user
    const store = await prisma.store.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    // Fetch orders for this store
    const orders = await prisma.orderItem.findMany({
      where: { storeId: store.id, order: { status: "PAID" } },
      include: {
        order: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true, // Include buyer's email if needed
              },
            },
          },
        },
        productVariant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true, // Include product images if needed
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching store orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch store orders." },
      { status: 500 }
    );
  }
}
