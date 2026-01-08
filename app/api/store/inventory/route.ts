import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ProductStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const lowStockFilter = searchParams.get("lowStock") === "true";
    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const defaultLowStockThreshold = 10;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required." },
        { status: 400 }
      );
    }

    // Verify user ownership
    const store = await prisma.store.findUnique({
      where: { id: storeId, userId: user.id },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Forbidden: Store not found." },
        { status: 403 }
      );
    }

    // Construct WHERE clause
    const whereClause: any = {
      storeId: storeId,
      status: ProductStatus.ACTIVE,
    };

    // Search by Product Name or Variant SKU
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        {
          variants: {
            some: {
              sellerSku: { contains: searchQuery, mode: "insensitive" },
            },
          },
        },
      ];
    }

    // Fetch products
    const [products, totalProducts] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        include: {
          variants: true, // Fetch all variants to determine stock status
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Flatten and post-process
    const inventoryItems = products.flatMap((product) => {
      // Use product-specific threshold or global default
      const threshold = product.lowStockThreshold ?? defaultLowStockThreshold;

      // Map variants to inventory items
      const items = product.variants.map((variant) => ({
        type: "variant",
        id: variant.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0] || null,
        variantName:
          [
            variant.variation, // e.g. "Black / Large"
            variant.size ? `Size: ${variant.size}` : null,
            variant.drinkSize ? `Drink Size: ${variant.drinkSize}` : null,
            variant.volume ? `Vol: ${variant.volume}` : null,
          ]
            .filter(Boolean)
            .join(" | ") || "Standard",
        currentStock: variant.quantity,
        unitPrice: variant.price,
        salePrice: variant.salePrice,
        isLowStock: variant.quantity <= threshold,
        sku: variant.sellerSku,
      }));

      // If lowStockFilter is active, only return items that meet the threshold
      if (lowStockFilter) {
        return items.filter((item) => item.isLowStock);
      }

      return items;
    });

    const finalTotalPages = Math.ceil(totalProducts / pageSize);

    return NextResponse.json({
      inventoryItems,
      totalItems: totalProducts,
      totalPages: finalTotalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < finalTotalPages,
      hasPreviousPage: page > 1,
      defaultLowStockThreshold,
    });
  } catch (error) {
    console.error("API Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory data." },
      { status: 500 }
    );
  }
}
