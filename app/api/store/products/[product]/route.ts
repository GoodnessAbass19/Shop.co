// app/api/seller/products/[productId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateUniqueSlug } from "@/utils/generate-slug";

// --- PATCH: Update Product ---
export async function PATCH(
  request: Request,
  { params }: { params: { product: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 15+, params is a Promise. Await it to be safe across versions.
    const resolvedParams = await params;
    const productId = resolvedParams.product;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      weight,
      images,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      highlight,
      variants,
      color,
      colorFamily,
    } = body;

    // Verify product exists and belongs to the user
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: { select: { userId: true } },
        variants: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    if (existingProduct.store.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this product." },
        { status: 403 }
      );
    }

    // Only generate a new slug if the name has actually changed
    let slug = existingProduct.slug;
    if (name && name !== existingProduct.name) {
      slug = await generateUniqueSlug("Product", name, existingProduct.slug);
    }

    const productUpdateData: any = {
      name,
      description,
      highlight,
      images,
      categoryId,
      subCategoryId: subCategoryId || null,
      subSubCategoryId: subSubCategoryId || null,
      slug,
      weight,
      color,
      colorFamily,
    };

    // Handle Variants with a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      if (Array.isArray(variants)) {
        const existingVariants = existingProduct.variants;

        const variantsToUpdate = variants.filter((v) => v.id);
        const variantsToCreate = variants.filter((v) => !v.id);

        // Update existing variants
        for (const variant of variantsToUpdate) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              // FIX: Changed 'variant' to 'variant.variant' to match the object property
              variation: variant.variant || null,
              size: variant.size || null,
              volume: variant.volume || null,
              drinkSize: variant.drink_size || null,
              sellerSku: variant.sellerSku,
              gtinBarcode: variant.gtinBarcode || null,
              quantity: variant.stock,
              price: variant.price,
              salePrice: variant.salePrice || null,
              saleStartDate: variant.saleStartDate || null,
              saleEndDate: variant.saleEndDate || null,
            },
          });
        }

        // Create new variants
        if (variantsToCreate.length > 0) {
          await tx.productVariant.createMany({
            data: variantsToCreate.map((v) => ({
              variation: v.variant || null,
              size: v.size || null,
              volume: v.volume || null,
              drinkSize: v.drink_size || null,
              sellerSku: v.sellerSku,
              gtinBarcode: v.gtinBarcode || null,
              quantity: v.stock,
              price: v.price,
              salePrice: v.salePrice || null,
              saleStartDate: v.saleStartDate || null,
              saleEndDate: v.saleEndDate || null,
              productId,
            })),
          });
        }

        // Delete removed variants
        const incomingIds = variantsToUpdate.map((v) => v.id);
        const toDelete = existingVariants.filter(
          (v) => !incomingIds.includes(v.id)
        );

        if (toDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: {
              id: { in: toDelete.map((v) => v.id) },
            },
          });
        }
      }

      // Final Product update within the transaction
      await tx.product.update({
        where: { id: productId },
        data: productUpdateData,
      });
    });

    // Re-fetch the fully updated product to return to the client
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        category: true,
        subCategory: true,
        subSubCategory: true,
      },
    });

    return NextResponse.json(
      { message: "Product updated successfully.", product: updatedProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

// --- DELETE: Delete Product ---
export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to the seller's store
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        store: {
          select: { userId: true },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }
    if (existingProduct.store.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this product." },
        { status: 403 }
      );
    }

    // Delete the product (Prisma's onDelete: Cascade will handle related variants, order items, etc.)
    const deletedProduct = await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json(
      { message: "Product deleted successfully.", product: deletedProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { product: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product } = params;
    if (!product) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const products = await prisma.product.findUnique({
      where: { id: product },
      include: {
        variants: true,
        category: true,
        subCategory: true,
        subSubCategory: true,
        reviews: true,
        store: { select: { userId: true } },
      },
    });

    if (!products) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }
    if (products.store.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this product." },
        { status: 403 }
      );
    }

    // Optionally, remove store.userId from response for privacy
    const { store, ...productData } = products;
    return NextResponse.json({ product: productData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}
