// app/api/seller/discounts/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log("Unauthorized access attempt to discounts: No user found.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      console.log("Bad Request: Missing storeId for discounts.");
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
      console.log(
        `Forbidden: Store ${storeId} not found or not owned by user ${user.id}.`
      );
      return NextResponse.json(
        { error: "Forbidden: Store not found or not owned by user." },
        { status: 403 }
      );
    }

    const discounts = await prisma.discount.findMany({
      where: {
        storeId: storeId,
      },
      orderBy: {
        createdAt: "desc", // Most recent discounts first
      },
      include: {
        products: {
          // Include products associated with the discount (optional, for display)
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ discounts }, { status: 200 });
  } catch (error) {
    console.error("API Error fetching seller discounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller discounts data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sellerStore) {
      return NextResponse.json(
        { error: "No store found for this user." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      code,
      description,
      percentage,
      amount,
      minOrderAmount,
      maxDiscountAmount,
      startsAt,
      expiresAt,
      isActive,
      productIds, // Array of product IDs to link this discount to
    } = body;

    // Basic validation
    if (!code || !startsAt || !expiresAt) {
      return NextResponse.json(
        {
          error: "Missing required discount fields: code, startsAt, expiresAt.",
        },
        { status: 400 }
      );
    }
    if (percentage === undefined && amount === undefined) {
      return NextResponse.json(
        { error: "Either percentage or amount must be provided." },
        { status: 400 }
      );
    }
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return NextResponse.json(
        { error: "Percentage must be between 0 and 100." },
        { status: 400 }
      );
    }
    if (amount !== undefined && amount < 0) {
      return NextResponse.json(
        { error: "Amount cannot be negative." },
        { status: 400 }
      );
    }
    if (new Date(startsAt) >= new Date(expiresAt)) {
      return NextResponse.json(
        { error: "Start date must be before end date." },
        { status: 400 }
      );
    }

    // Check for duplicate code within the store
    const existingDiscount = await prisma.discount.findUnique({
      where: { code: code },
      select: { id: true, storeId: true },
    });

    if (existingDiscount && existingDiscount.storeId === sellerStore.id) {
      return NextResponse.json(
        { error: "Discount code already exists for your store." },
        { status: 409 }
      );
    }

    const newDiscount = await prisma.discount.create({
      data: {
        code,
        description,
        percentage,
        amount,
        minOrderAmount,
        maxDiscountAmount,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
        isActive: isActive !== undefined ? isActive : true, // Default to true
        storeId: sellerStore.id,
        products:
          productIds && productIds.length > 0
            ? {
                connect: productIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
    });

    return NextResponse.json(
      { message: "Discount created successfully.", discount: newDiscount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json(
      { error: "Failed to create discount." },
      { status: 500 }
    );
  }
}
