// app/api/stores/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateUniqueSlug } from "@/utils/generate-slug";
import { Role } from "@prisma/client";
import { uploadImage } from "@/lib/upload-image";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, logo, products, banner } = await request.json(); // Destructure products from body

    // Basic validation for store name
    if (!name) {
      return NextResponse.json(
        { error: "Store name is required." },
        { status: 400 }
      );
    }

    if (banner && !Array.isArray(banner)) {
      return NextResponse.json(
        { error: "Banner must be an array of image URLs." },
        { status: 400 }
      );
    }

    // Upload all banner images and store as array of strings
    const bannerUrls: string[] = [];
    for (const file of banner || []) {
      const url = await uploadImage(file, "stores/banners");
      bannerUrls.push(url);
    }

    // Check if the user already has a store
    const existingStore = await prisma.store.findUnique({
      where: { userId: user.id },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: "You already have a store created." },
        { status: 400 }
      );
    }

    // Validate products (server-side for security and data integrity)
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "At least one product is required for your store." },
        { status: 400 }
      );
    }

    // Prepare products and their variants for nested creation
    const productsToCreate = [];
    for (const productData of products) {
      if (
        !productData.name ||
        productData.price <= 0 ||
        !productData.categoryId ||
        productData.images.length === 0
      ) {
        return NextResponse.json(
          {
            error: `Product "${
              productData.name || "Unnamed Product"
            }" has missing required fields (name, price, category, images).`,
          },
          { status: 400 }
        );
      }
      if (!productData.variants || productData.variants.length === 0) {
        return NextResponse.json(
          {
            error: `Product "${productData.name}" must have at least one variant.`,
          },
          { status: 400 }
        );
      }

      const productSlug = await generateUniqueSlug("Product", productData.name);

      const variantsToCreate = [];
      for (const variantData of productData.variants) {
        if (
          variantData.price <= 0 ||
          variantData.stock < 0 ||
          (!variantData.size && !variantData.color)
        ) {
          return NextResponse.json(
            {
              error: `Variant for "${productData.name}" has invalid data (price, stock, or missing size/color).`,
            },
            { status: 400 }
          );
        }
        variantsToCreate.push({
          size: variantData.size || null,
          color: variantData.color || null,
          price: parseFloat(variantData.price),
          stock: parseInt(variantData.stock, 10),
          sku: variantData.sku || null,
        });
      }

      productsToCreate.push({
        name: productData.name,
        slug: productSlug, // Generated unique slug for product
        description: productData.description,
        price: parseFloat(productData.price),
        images: productData.images, // Array of strings
        categoryId: productData.categoryId,
        subCategoryId: productData.subCategoryId,
        subSubCategoryId: productData.subSubCategoryId,
        stock: parseInt(productData.stock, 10),
        // isFeatured: productData.isFeatured || false,
        variants: {
          create: variantsToCreate, // Nested create for variants
        },
      });
    }

    // Create the store and nested products/variants
    const newStore = await prisma.store.create({
      data: {
        name,
        slug: await generateUniqueSlug("Store", name), // Generate slug for store
        description,
        logo,
        banner: bannerUrls, // Store banner URLs
        userId: user.id, // Link the store to the current authenticated user
        products: {
          create: productsToCreate, // Nested create for products
        },
      },
      include: {
        products: {
          // Include products to return them in the response
          include: {
            variants: true,
          },
        },
      },
    });

    // --- NEW: Update the user's role to SELLER ---
    await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.SELLER }, // Set user's role to SELLER
    });
    console.log(`User ${user.id} role updated to SELLER.`);

    return NextResponse.json(
      {
        success: true,
        message: "Store and products created successfully!",
        store: newStore,
      },
      { status: 201 } // 201 Created
    );
  } catch (error: any) {
    console.error("API Error creating store and products:", error);

    // Handle unique constraint error for store name (slug is handled by utility)
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return NextResponse.json(
        { error: "Store name already taken. Please choose a different name." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create store and products." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: Enhance getCurrentUser to return user role, or fetch here
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    // Authorization check: Only sellers (or admins) should access this dashboard
    if (
      !fullUser ||
      fullUser.role !== Role.SELLER
      // && fullUser.role !== Role.ADMIN
    ) {
      return NextResponse.json(
        { error: "Forbidden: You are not a seller." },
        { status: 403 }
      );
    }

    // Fetch the seller's store and its associated products
    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      include: {
        products: {
          orderBy: { createdAt: "desc" }, // Order products by newest first
          include: {
            variants: true, // Include product variants
            category: true, // Include category details if you want to display them
            subCategory: true,
            subSubCategory: true,
          },
        },
        orderItems: {
          include: {
            order: {
              include: {
                buyer: true, // Include user details for the order
              },
            },
          },
        },
      },
    });

    if (!sellerStore) {
      return NextResponse.json(
        { error: "No store found for this user." },
        { status: 404 }
      );
    }

    return NextResponse.json({ store: sellerStore }, { status: 200 });
  } catch (error) {
    console.error("API Error fetching seller dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller dashboard data." },
      { status: 500 }
    );
  }
}
