import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOtp, verifyOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const { email } = await request.json();
  // Here you would typically generate a password reset token,
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // send an email with the reset link containing the token.
    await sendOtp(email);
    // For demonstration, we just log the OTP token.

    return NextResponse.json(
      { message: "OTP sent to your email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process forgot password request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { email, otp } = await request.json();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Verify the OTP
    await verifyOtp(email, otp);
    return NextResponse.json(
      { message: "OTP verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
