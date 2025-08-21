import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      representativeName,
      idNumber,
      idType,
      idImageFront,
      idImageBack,
      taxIdentificationNumber,
      taxIdImage,
      vatNumber,
      address1,
      address2,
      city,
      state,
      postalCode,
      country,
    } = await request.json(); // Destructure products from body

    // Check if the user already has a store
    const existingStore = await prisma.store.findUnique({
      where: { userId: user.id },
    });

    // Create store legal representative
    const businessInfo = await prisma.businessInfo.create({
      data: {
        fullName: representativeName,
        idType: idType,
        idNumber: idNumber,
        idImageFront,
        idImageBack,
        taxId: taxIdentificationNumber,
        taxIdImage,
        vatNumber,
        address1,
        address2,
        city,
        country,
        state,
        postalCode,
        isComplete: true,
        store: {
          connect: { id: existingStore?.id },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Business updated successfully!",
        businessInfo: businessInfo,
      },
      { status: 201 } // 201 Created
    );
  } catch (error: any) {
    console.error("API Error updating business indo:", error);

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

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      representativeName,
      idNumber,
      idType,
      idImageFront,
      idImageBack,
      taxIdentificationNumber,
      taxIdImage,
      vatNumber,
      address1,
      address2,
      city,
      state,
      postalCode,
      country,
    } = await request.json();

    // Find the user's store
    const existingStore = await prisma.store.findUnique({
      where: { userId: user.id },
    });

    if (!existingStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Find the business info for this store
    const businessInfo = await prisma.businessInfo.findUnique({
      where: { storeId: existingStore.id },
    });

    if (!businessInfo) {
      return NextResponse.json(
        { error: "Business info not found" },
        { status: 404 }
      );
    }

    // Update business info
    const updatedBusinessInfo = await prisma.businessInfo.update({
      where: { id: businessInfo.id },
      data: {
        fullName: representativeName,
        idType,
        idNumber,
        idImageFront,
        idImageBack,
        taxId: taxIdentificationNumber,
        taxIdImage,
        vatNumber,
        address1,
        address2,
        city,
        country,
        state,
        postalCode,
        isComplete: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Business info updated successfully!",
        businessInfo: updatedBusinessInfo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error updating business info:", error);
    return NextResponse.json(
      { error: "Failed to update business info." },
      { status: 500 }
    );
  }
}
