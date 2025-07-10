// app/api/seller/products/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required." },
        { status: 400 }
      );
    }

    // Verify user owns this store
    const store = await prisma.store.findUnique({
      where: { id: storeId, userId: user.id },
      select: { id: true },
    });
    if (!store) {
      return NextResponse.json(
        { error: "Forbidden: Store not found or not owned by user." },
        { status: 403 }
      );
    }

    const products = await prisma.product.findMany({
      where: { storeId: storeId }, // Filter by storeId
      include: {
        variants: true,
        category: true,
        subCategory: true,
        subSubCategory: true,
      },
      orderBy: { createdAt: "desc" }, // Example ordering
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("API Error fetching seller products:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller products." },
      { status: 500 }
    );
  }
}
