import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(addresses);
}

const MAPBOX_GEOCODING_BASE_URL =
  "https://api.mapbox.com/search/geocode/v6/forward";
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
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

  const newAddress = await prisma.address.create({
    data: {
      userId: user.id,
      street,
      city,
      state,
      country,
      postalCode,
      isDefault,
      latitude,
      longitude,
    },
  });

  // If this address is default, unset other addresses as default
  if (isDefault) {
    await prisma.address.updateMany({
      where: {
        userId: user.id,
        NOT: { id: newAddress.id },
      },
      data: { isDefault: false },
    });
  }

  return NextResponse.json(newAddress, { status: 201 });
}
