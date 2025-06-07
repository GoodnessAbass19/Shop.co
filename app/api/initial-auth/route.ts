// app/api/auth/initiate-auth/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendOtp } from "@/lib/otp"; // Import your sendOtp function

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, authType, redirect_url } = body; // Simplified parameters

    if (!email || !password || !authType) {
      return NextResponse.json(
        { error: "Email, password, and authentication type are required." },
        { status: 400 }
      );
    }

    if (authType === "login") {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password." }, // Generic message for security
          { status: 401 }
        );
      }

      const passwordMatch = await bcrypt.compare(password, user.password); // Use async compare
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      // Call your sendOtp function
      await sendOtp(user.email);

      return NextResponse.json(
        { message: "OTP sent to your email.", email, nextStep: "verifyOtp" },
        { status: 200 }
      );
    } else if (authType === "register") {
      if (!name) {
        // Only name is required for initial registration
        return NextResponse.json(
          { error: "Username is required for registration." },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists." },
          { status: 409 } // Conflict
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          // phone and address are now expected to be handled later or optional in schema
          role: "BUYER", // Default role
        },
      });

      // Call your sendOtp function
      await sendOtp(newUser.email);

      return NextResponse.json(
        {
          message:
            "OTP sent to your email. Please verify to complete registration.",
          email,
          nextStep: "verifyOtp",
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid authentication type." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Authentication initiation error:", error);
    // Be careful with error messages from Nodemailer/OTP, avoid exposing internal details
    return NextResponse.json(
      { error: "Failed to initiate authentication. Please try again later." },
      { status: 500 }
    );
  }
}
