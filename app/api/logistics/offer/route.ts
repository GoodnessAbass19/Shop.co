// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth";
// import { pusherServer } from "@/lib/pusher"; // your configured server client
// import { encodeGeoHash5 } from "@/lib/geohash";

// export async function POST(req: Request) {
//   const user = await getCurrentUser();
//   if (!user)
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const { orderItemId, sellerLat, sellerLng } = await req.json();

//   const item = await prisma.orderItem.findUnique({
//     where: { id: orderItemId },
//     include: {
//       order: { include: { buyer: true } },
//       store: true,
//       productVariant: { include: { product: true } },
//     },
//   });
//   if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   if (
//     item.deliveryStatus !== "PENDING" &&
//     item.deliveryStatus !== "READY_FOR_PICKUP"
//   ) {
//     return NextResponse.json({ error: "Invalid state" }, { status: 400 });
//   }

//   // mark ready
//   await prisma.orderItem.update({
//     where: { id: orderItemId },
//     data: { deliveryStatus: "READY_FOR_PICKUP" },
//   });

//   const hash = encodeGeoHash5(sellerLat, sellerLng);
//   await pusherServer.trigger(`presence-nearby-${hash}`, "order_item.offered", {
//     orderItemId,
//     storeId: item.storeId,
//     sellerLat,
//     sellerLng,
//     itemName: item.productVariant.product.name,
//     price: item.price,
//   });

//   return NextResponse.json({ ok: true });
// }

// app/api/logistics/offer/route.ts

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
