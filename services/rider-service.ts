// services/riderService.ts
import { encodeGeoHash5 } from "@/lib/geohash";
import prisma from "@/lib/prisma";

// Haversine formula to calculate distance in KM
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get all nearby available riders within 1.5km – 3km
 */
export async function getNearbyRiders(lat: number, lon: number) {
  const geohash = encodeGeoHash5(lat, lon);
  //   const neighbors = getGeoHashNeighbors(geohash);
  const nearbyGeoHashes = [
    geohash,
    // ...neighbors
  ];

  // 1. Fetch riders in same / nearby geohash
  const candidates = await prisma.rider.findMany({
    where: {
      geohash: { in: nearbyGeoHashes },
      isActive: true,
    },
  });

  // 2. Filter based on distance
  const filtered = candidates.filter((r) => {
    const distance = haversineDistance(lat, lon, r.latitude!, r.longitude!);
    return distance >= 1.5 && distance <= 3; // between 1.5km and 3km
  });

  // 3. Sort by closest
  filtered.sort(
    (a, b) =>
      haversineDistance(lat, lon, a.latitude!, a.longitude!) -
      haversineDistance(lat, lon, b.latitude!, b.longitude!)
  );

  return filtered;
}
