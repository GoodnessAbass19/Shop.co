import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const currentUser = await getCurrentUser();

  // Remove the token cookie
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // Expire immediately
  });

  const user = await prisma.user.update({
    where: { id: currentUser?.id },
    data: { isSeller: false },
  });

  // Remove the store token cookie if it exists
  cookieStore.set("store-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // Expire immediately
  });

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );
}
