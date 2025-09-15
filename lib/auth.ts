// lib/auth.ts
import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import prisma from "./prisma";
import geolib from "geolib";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        notifications: true,
        cart: {
          include: {
            cartItems: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

export async function getCurrentRider() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    const user = await prisma.rider.findUnique({
      where: {
        id: decoded.userId,
        // geohash: { in: nearbyGeoHashes },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

// lib/riders.ts

// distance in meters
const MIN_DISTANCE = 1000;
const MAX_DISTANCE = 3000;

export async function getNearbyRiders(
  lat: number,
  lng: number,
  sellerGeohash: string
) {
  // Get active riders with location
  const riders = await prisma.rider.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
  });

  // Filter riders within distance range
  return riders.filter((r) => {
    const distance = geolib.getDistance(
      { latitude: lat, longitude: lng },
      { latitude: r.latitude!, longitude: r.longitude! }
    );
    return distance >= MIN_DISTANCE && distance <= MAX_DISTANCE;
  });
}
