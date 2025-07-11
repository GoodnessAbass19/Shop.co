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

    const { product: productId } = params;
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
      price,
      images,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      stock,
      variants, // Array of variant objects (with/without id)
      status,
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

    const slug = await generateUniqueSlug(
      "Product",
      name,
      existingProduct.slug
    );

    const productUpdateData: any = {
      name,
      description,
      price,
      images,
      categoryId,
      subCategoryId: subCategoryId || null,
      subSubCategoryId: subSubCategoryId || null,
      stock,
      status,
      slug,
    };

    // Handle Variants
    if (Array.isArray(variants)) {
      const existingVariants = existingProduct.variants;

      const variantsToUpdate = variants.filter((v) => v.id);
      const variantsToCreate = variants.filter((v) => !v.id);

      // Update existing variants
      for (const variant of variantsToUpdate) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            size: variant.size || null,
            color: variant.color || null,
            price: variant.price,
            stock: variant.stock,
            sku: variant.sku || null,
          },
        });
      }

      // Create new variants
      if (variantsToCreate.length > 0) {
        await prisma.productVariant.createMany({
          data: variantsToCreate.map((v) => ({
            size: v.size || null,
            color: v.color || null,
            price: v.price,
            stock: v.stock,
            sku: v.sku || null,
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
        await prisma.productVariant.deleteMany({
          where: {
            id: { in: toDelete.map((v) => v.id) },
          },
        });
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: productUpdateData,
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
