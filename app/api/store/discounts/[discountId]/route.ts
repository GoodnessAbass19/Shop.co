// app/api/seller/discounts/[discountId]/route.ts
// (Existing PATCH and DELETE methods would also be in this file)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// --- GET: Fetch Single Discount ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ discountId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discountId } = await params;
    if (!discountId) {
      return NextResponse.json(
        { error: "Discount ID is required." },
        { status: 400 }
      );
    }

    // Fetch the discount with its associated products
    const discount = await prisma.discount.findUnique({
      where: { id: discountId },
      include: {
        products: {
          select: { id: true, name: true }, // Only need ID and name for selection
        },
      },
    });

    if (!discount) {
      return NextResponse.json(
        { error: "Discount not found." },
        { status: 404 }
      );
    }

    // Verify discount belongs to the seller's store
    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!sellerStore || discount.storeId !== sellerStore.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this discount." },
        { status: 403 }
      );
    }

    return NextResponse.json({ discount }, { status: 200 });
  } catch (error) {
    console.error("Error fetching single discount:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount details." },
      { status: 500 }
    );
  }
}

// (Existing PATCH and DELETE methods from previous turn would follow here)
// --- PATCH: Update Discount ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ discountId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discountId } = await params;
    if (!discountId) {
      return NextResponse.json(
        { error: "Discount ID is required." },
        { status: 400 }
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
      productIds, // Array of product IDs to link/unlink
    } = body;

    // Verify discount exists and belongs to the seller's store
    const existingDiscount = await prisma.discount.findUnique({
      where: { id: discountId },
      select: {
        storeId: true,
        code: true, // Need current code to check for duplicates
        percentage: true, // Include percentage for validation
        amount: true, // Include amount for validation
        products: { select: { id: true } }, // Get current linked products
      },
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { error: "Discount not found." },
        { status: 404 }
      );
    }
    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!sellerStore || existingDiscount.storeId !== sellerStore.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this discount." },
        { status: 403 }
      );
    }

    // Validation
    if (
      percentage === undefined &&
      amount === undefined &&
      !existingDiscount.percentage &&
      !existingDiscount.amount
    ) {
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
    if (startsAt && expiresAt && new Date(startsAt) >= new Date(expiresAt)) {
      return NextResponse.json(
        { error: "Start date must be before end date." },
        { status: 400 }
      );
    }
    // Check for duplicate code if code is being changed
    if (code && code !== existingDiscount.code) {
      const duplicateCode = await prisma.discount.findUnique({
        where: { code: code },
        select: { id: true, storeId: true },
      });
      if (duplicateCode && duplicateCode.storeId === sellerStore.id) {
        return NextResponse.json(
          { error: "New discount code already exists for your store." },
          { status: 409 }
        );
      }
    }

    // Prepare data for discount update
    const discountUpdateData: any = {
      code,
      description,
      percentage,
      amount,
      minOrderAmount,
      maxDiscountAmount,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: isActive,
    };

    // Handle product linking/unlinking
    if (productIds !== undefined) {
      const currentProductIds = existingDiscount.products.map((p) => p.id);
      const productsToConnect = productIds.filter(
        (id: string) => !currentProductIds.includes(id)
      );
      const productsToDisconnect = currentProductIds.filter(
        (id: string) => !productIds.includes(id)
      );

      if (productsToConnect.length > 0 || productsToDisconnect.length > 0) {
        discountUpdateData.products = {};
        if (productsToConnect.length > 0) {
          discountUpdateData.products.connect = productsToConnect.map(
            (id: string) => ({ id })
          );
        }
        if (productsToDisconnect.length > 0) {
          discountUpdateData.products.disconnect = productsToDisconnect.map(
            (id: string) => ({ id })
          );
        }
      }
    }

    const updatedDiscount = await prisma.discount.update({
      where: { id: discountId },
      data: discountUpdateData,
      include: {
        products: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: "Discount updated successfully.", discount: updatedDiscount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount." },
      { status: 500 }
    );
  }
}

// --- DELETE: Delete Discount ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ discountId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discountId } = await params;
    if (!discountId) {
      return NextResponse.json(
        { error: "Discount ID is required." },
        { status: 400 }
      );
    }

    // Verify discount exists and belongs to the seller's store
    const existingDiscount = await prisma.discount.findUnique({
      where: { id: discountId },
      select: { storeId: true },
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { error: "Discount not found." },
        { status: 404 }
      );
    }
    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!sellerStore || existingDiscount.storeId !== sellerStore.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this discount." },
        { status: 403 }
      );
    }

    // Delete the discount
    const deletedDiscount = await prisma.discount.delete({
      where: { id: discountId },
    });

    return NextResponse.json(
      { message: "Discount deleted successfully.", discount: deletedDiscount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { error: "Failed to delete discount." },
      { status: 500 }
    );
  }
}
