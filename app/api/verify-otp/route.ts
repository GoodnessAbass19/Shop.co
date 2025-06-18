// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
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
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
      }, // Select role and isVerified
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 4. If user is not yet verified, update their status to verified
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true, // Crucial: Mark user as verified
        },
      });
      console.log(`User ${user.email} successfully verified.`);
    } else {
      console.log(
        `User ${user.email} already verified. Proceeding with login.`
      );
    }

    // 5. Generate JWT token (include user role)
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }); // Include role

    // 6. Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
      path: "/",
    });

    // 7. Return success response with redirect URL
    return NextResponse.json(
      {
        success: true,
        message: "Account verified and logged in successfully!",
        redirect_url: redirect_url || "/",
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
