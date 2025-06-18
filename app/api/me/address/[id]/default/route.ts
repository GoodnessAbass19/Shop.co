import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  _: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const address = await prisma.address.findUnique({ where: { id } });

  if (!address || address.userId !== user.id) {
    return NextResponse.json(
      { error: "Address not found or access denied." },
      { status: 403 }
    );
  }

  // First unset all other default addresses
  await prisma.address.updateMany({
    where: { userId: user.id },
    data: { isDefault: false },
  });

  // Set this one as default
  const updated = await prisma.address.update({
    where: { id },
    data: { isDefault: true },
  });

  return NextResponse.json(updated);
}
