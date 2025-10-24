import { encodeGeoHash5, getGeoHashNeighbors } from "@/lib/geohash";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");

  // get rider's current geohash
  const geohash = encodeGeoHash5(lat, lng);
  const neighbors = getGeoHashNeighbors(geohash);

  const offers = await prisma.deliveryItem.findMany({
    where: {
      status: "PENDING",
      sellerGeohash: { in: [geohash, ...neighbors] },
      riderId: null, // not yet accepted
    },
    include: {
      orderItem: { include: { productVariant: true, store: true } },
    },
  });

  return Response.json({ offers });
}
