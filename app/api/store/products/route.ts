// app/api/seller/products/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProductStatus, Role } from "@prisma/client";

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
      name,
      description,
      highlight,
      weight, // Base price for product, can be overridden by variants
      images,
      color,
      colorFamily,
      brand,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      stock, // Overall stock for product, can be managed by variants
      variants, // Array of variant objects
    } = body;

    // Basic validation
    if (
      !name ||
      !brand ||
      !categoryId ||
      !images ||
      images.length === 0 ||
      stock === undefined ||
      stock < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required product fields: name, price, categoryId, images, stock.",
        },
        { status: 400 }
      );
    }
    if (variants && variants.length > 0) {
      // If variants are provided, ensure they have necessary fields
      for (const variant of variants) {
        if (
          variant.price === undefined ||
          variant.price < 0 ||
          variant.stock === undefined ||
          variant.stock < 0 ||
          (!variant.size && !variant.color)
        ) {
          return NextResponse.json(
            {
              error:
                "Invalid variant data: price, stock, and at least one of size/color are required for each variant.",
            },
            { status: 400 }
          );
        }
      }
    }

    // Create the product
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        highlight,
        color,
        colorFamily,
        brand,
        lowStockThreshold: 10,
        images: images, // Store image URLs directly
        categoryId,
        subCategoryId: subCategoryId || null,
        subSubCategoryId: subSubCategoryId || null,
        weight,

        storeId: sellerStore.id, // Link product to the seller's store
        status: ProductStatus.ACTIVE, // Default status
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-*|-*$/g, ""), // Generate slug
        // Create variants if provided
        variants: {
          createMany: {
            data: variants.map((v: any) => ({
              size: v.size || null,
              color: v.color || null,
              price: v.price,
              stock: v.stock,
              sku: v.sku || null,
            })),
          },
        },
      },
      include: {
        variants: true, // Return created variants
        category: true,
        subCategory: true,
        subSubCategory: true,
      },
    });

    return NextResponse.json(
      { message: "Product created successfully.", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
