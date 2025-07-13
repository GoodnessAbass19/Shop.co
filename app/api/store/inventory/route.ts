// app/api/seller/inventory/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProductStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log("Unauthorized access attempt to inventory: No user found.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const lowStockFilter = searchParams.get("lowStock"); // 'true' for low stock items
    const searchQuery = searchParams.get("search"); // Search by product name or SKU
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const lowStockThreshold = 10; // Define your low stock threshold here

    if (!storeId) {
      console.log("Bad Request: Missing storeId for inventory.");
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

    // Construct the WHERE clause for Prisma
    const whereClause: any = {
      storeId: storeId,
      status: ProductStatus.ACTIVE, // Only show active products in inventory
    };

    if (searchQuery) {
      whereClause.name = {
        contains: searchQuery,
        mode: "insensitive",
      };
      // Note: Searching variants by SKU/size/color would require a more complex query
      // involving `OR` conditions across product and its variants.
      // For simplicity, this search is only on product name.
    }

    // Fetch products that match the criteria
    const [products, totalProducts] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        include: {
          variants: {
            // If lowStockFilter is true, filter variants by stock
            where:
              lowStockFilter === "true"
                ? { stock: { lte: lowStockThreshold } }
                : undefined,
            orderBy: { stock: "asc" }, // Order variants by stock for low-stock view
          },
        },
        orderBy: {
          name: "asc", // Order products alphabetically
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({
        where: whereClause,
      }),
    ]);

    // Post-process to filter products that have NO variants or whose variants are all in stock
    // if lowStockFilter is active.
    let filteredProducts = products;
    if (lowStockFilter === "true") {
      filteredProducts = products.filter((product) => {
        // If product has variants, check if any variant is low stock
        if (product.variants.length > 0) {
          return product.variants.some(
            (variant) => variant.stock <= lowStockThreshold
          );
        }
        // If product has no variants, check its main stock
        return product.stock! <= lowStockThreshold;
      });
    }

    // Flatten products and their variants into a single list for easier display
    // This creates an array of items, where each item is either a product (if no variants)
    // or a specific product variant.
    const inventoryItems = filteredProducts.flatMap((product) => {
      if (product.variants.length > 0) {
        return product.variants.map((variant) => ({
          type: "variant",
          id: variant.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images?.[0] || null,
          variantName:
            `${variant.size ? `Size: ${variant.size}` : ""}${
              variant.color ? ` Color: ${variant.color}` : ""
            }`.trim() || "Default Variant",
          currentStock: variant.stock,
          unitPrice: variant.price,
          isLowStock: variant.stock <= lowStockThreshold,
          sku: variant.sku,
        }));
      } else {
        // Product without variants
        return [
          {
            type: "product",
            id: product.id,
            productId: product.id, // Self-reference for consistency
            productName: product.name,
            productSlug: product.slug,
            productImage: product.images?.[0] || null,
            variantName: "N/A", // No specific variant
            currentStock: typeof product.stock === "number" ? product.stock : 0,
            unitPrice: typeof product.price === "number" ? product.price : 0,
            isLowStock:
              typeof product.stock === "number"
                ? product.stock <= lowStockThreshold
                : false,
            sku: null, // No SKU for main product if variants handle it
          },
        ];
      }
    });

    // Recalculate total pages based on the actual number of inventory items after flattening/filtering
    const totalInventoryItems = inventoryItems.length; // This count is for the current page's filtered items
    // For proper pagination, totalProducts should be count of products that meet the initial criteria
    // and then apply filtering for low stock on the frontend or refine the Prisma query to count correctly.
    // For now, let's assume `totalProducts` from Prisma count is sufficient for totalPages.
    const finalTotalPages = Math.ceil(totalProducts / pageSize); // Use totalProducts from initial count

    // If lowStockFilter is applied, the `totalProducts` count from Prisma might be misleading
    // because it counts all products matching `whereClause` before variant filtering.
    // A more precise `totalItems` for pagination would require counting the `inventoryItems`
    // across all pages, which is complex with Prisma's current aggregation capabilities.
    // For simplicity, we'll use `totalProducts` as the base for pagination.

    return NextResponse.json(
      {
        inventoryItems,
        totalItems: totalProducts, // Total products found before low-stock flattening
        totalPages: finalTotalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < finalTotalPages,
        hasPreviousPage: page > 1,
        lowStockThreshold,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching seller inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller inventory data." },
      { status: 500 }
    );
  }
}
