import { verifyCode } from "@/lib/delivery";
import { signToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, otp, redirect_url } = await req.json();

    // 1. Find and validate OTP record
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        email,
        token: otp,
        expiresAt: { gt: new Date() }, // OTP must not be expired
      },
    });

    const verify = await verifyCode(otp, otpRecord?.tokenHash!);

    if (!verify) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired OTP. Please try again or request a new one.",
        },
        { status: 401 },
      );
    }

    if (!otpRecord) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired OTP. Please try again or request a new one.",
        },
        { status: 401 },
      );
    }

    // 2. Clean up used OTP (delete it)
    await prisma.otpToken.delete({ where: { id: otpRecord.id } });

    // 3. Find the admin associated with the email
    const admin = await prisma.user.findUnique({
      where: { email, role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found." },
        { status: 404 },
      );
    }

    // 4. Generate JWT token (include user role)
    const token = signToken({
      userId: admin.id,
      email: admin.email,
      role: "ADMIN",
    });

    const cookieStore = await cookies();
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 60 * 60 * 6, // 6 hour
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account verified and logged in successfully!",
        redirect_url: redirect_url || "/admin/dashboard",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to verify OTP due to an internal server error. Please try again.",
      },
      { status: 500 },
    );
  }
}
