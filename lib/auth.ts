// lib/auth.ts
import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import prisma from "./prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        isBuyer: true,
        isSeller: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}
