import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name || typeof name !== "string") {
    return NextResponse.json({ exists: false });
  }
  try {
    const existingStore = await prisma.store.findUnique({
      where: { name },
      select: { id: true },
    });
    return NextResponse.json({ exists: !!existingStore }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
