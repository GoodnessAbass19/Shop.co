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

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { street, city, state, country, postalCode, isDefault } = body;

  const newAddress = await prisma.address.create({
    data: {
      userId: user.id,
      street,
      city,
      state,
      country,
      postalCode,
      isDefault,
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
