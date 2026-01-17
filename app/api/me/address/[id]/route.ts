import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

const MAPBOX_GEOCODING_BASE_URL =
  "https://api.mapbox.com/search/geocode/v6/forward";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existingAddress = await prisma.address.findUnique({
    where: { id },
  });

  if (!existingAddress || existingAddress.userId !== user.id) {
    return NextResponse.json(
      { error: "Address not found or access denied." },
      { status: 403 }
    );
  }

  const { street, city, state, country, postalCode, isDefault } = body;

  const addressQuery = [street, city, state, country, postalCode]
    .filter(Boolean)
    .join(", ");

  let latitude: number | undefined;
  let longitude: number | undefined;

  if (addressQuery.length > 0) {
    try {
      // Use the Secret Token for server-side calls!
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

      if (!accessToken) {
        // Optional: log an error if the token is missing
        console.error("Mapbox secret token is not set.");
        // We will proceed without geocoding if the token is missing
      } else {
        const url = `${MAPBOX_GEOCODING_BASE_URL}?q=${encodeURIComponent(
          addressQuery
        )}&access_token=${accessToken}`;

        const response = await fetch(url);
        const data = await response.json();

        // Check if results were found
        if (data.features && data.features.length > 0) {
          // Mapbox returns coordinates as [longitude, latitude]
          const [lon, lat] = data.features[0].geometry.coordinates;
          longitude = lon;
          latitude = lat;

          // Optional: You could also save the full address name returned by Mapbox
          // const fullAddress = data.features[0].place_name;
        } else {
          console.warn(
            `No geocoding result found for address: ${addressQuery}`
          );
        }
      }
    } catch (error) {
      // Handle fetch or JSON parsing errors gracefully
      console.error("Error during Mapbox geocoding:", error);
      // Proceed without lat/lon if the geocoding step fails
    }
  }

  const updatedAddress = await prisma.address.update({
    where: { id },
    data: {
      ...body,
      latitude,
      longitude,
    },
  });

  // If user wants to make it default
  if (body.isDefault) {
    await prisma.address.updateMany({
      where: {
        userId: user.id,
        NOT: { id },
      },
      data: { isDefault: false },
    });
  }

  return NextResponse.json(updatedAddress);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // Address ID from the URL

    // 1. Find the address to ensure it exists and belongs to the user
    const addressToDelete = await prisma.address.findUnique({
      where: { id, userId: user.id },
      select: { id: true, isDefault: true }, // Select necessary fields
    });

    if (!addressToDelete) {
      return NextResponse.json(
        { error: "Address not found or does not belong to you." },
        { status: 404 }
      );
    }

    // 2. Prevent deletion of the default address unless it's the only one
    const userAddressesCount = await prisma.address.count({
      where: { userId: user.id },
    });

    if (addressToDelete.isDefault && userAddressesCount > 1) {
      return NextResponse.json(
        {
          error:
            "Cannot delete the default address. Please set another address as default first.",
        },
        { status: 400 }
      );
    }

    // 3. Check for "ongoing" orders linked to this address
    // "Ongoing" orders are those that are not DELIVERED or CANCELLED.
    const ongoingOrders = await prisma.order.findMany({
      where: {
        addressId: id, // Linked to the address we're trying to delete
        status: {
          notIn: [
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.REFUNDED,
          ], // Orders that are not yet finished
        },
      },
      select: { id: true, status: true }, // Select relevant fields
    });

    if (ongoingOrders.length > 0) {
      const ongoingOrderIds = ongoingOrders.map((order) => order.id).join(", ");
      return NextResponse.json(
        {
          error: `This address cannot be deleted because it is linked to active/ongoing orders (e.g., PENDING, INITIATED, COMPLETED, SHIPPED). Please resolve orders: ${ongoingOrderIds}`,
        },
        { status: 400 } // Bad request or conflict status
      );
    }

    // 4. If no ongoing orders, proceed with deletion
    // Due to `onDelete: SetNull` in schema.prisma, historical DELIVERED/CANCELLED orders
    // will have their addressId set to NULL, allowing the address to be deleted.
    await prisma.address.delete({ where: { id, userId: user.id } });

    return NextResponse.json(
      { success: true, message: "Address deleted." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error deleting address:", error);

    // Prisma's P2003 error for foreign key constraint should theoretically no longer happen
    // for DELIVERED/CANCELLED orders if onDelete: SetNull is correctly applied.
    // However, keeping a general error handler is good practice.
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Foreign key constraint violation: Address is linked to an unhandled order type.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete address due to an internal error." },
      { status: 500 }
    );
  }
}
