import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { signToken } from "@/lib/jwt";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Use your custom getCurrentUser function to get the authenticated user
    const user = await getCurrentUser();

    // If user is null, it means the token was invalid, missing, or expired
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, otp, redirect_url } = await req.json(); // Destructure redirect_url

    // 1. Find and validate OTP record
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        email,
        token: otp,
        expiresAt: { gt: new Date() }, // OTP must not be expired
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired OTP. Please try again or request a new one.",
        },
        { status: 401 }
      );
    }

    // 2. Clean up used OTP (delete it)
    await prisma.otpToken.delete({ where: { id: otpRecord.id } });

    // 3. Find the user associated with the email
    const store = await prisma.store.findUnique({
      where: { contactEmail: email, userId: user.id },
      select: {
        id: true,
        contactEmail: true,
        name: true,
        contactPhone: true,
        userId: true,
        user: { select: { role: true } },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 5. Generate JWT token (include user role)
    const token = signToken({
      userId: store.userId,
      email: store.contactEmail,
      role: store.user.role,
    }); // Include role

    // 6. Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("store-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 60 * 60 * 6, // 6 hour
      sameSite: "lax",
      path: "/",
    });

    const updatedUser = await prisma.user.update({
      where: { id: store.userId },
      data: { isSeller: true },
    });

    // 7. Return success response with redirect URL
    return NextResponse.json(
      {
        success: true,
        message: "Account verified and logged in successfully!",
        redirect_url: redirect_url || "/your/store/dashboard",
        token: token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to verify OTP due to an internal server error. Please try again.",
      },
      { status: 500 }
    );
  }
}
