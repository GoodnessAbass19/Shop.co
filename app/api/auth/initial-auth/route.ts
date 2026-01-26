import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendOtp } from "@/lib/otp"; // Import your sendOtp function
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      name,
      phone,
      gender,
      birthDate,
      authType,
      redirect_url,
    } = body;

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
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      await sendOtp(user.email);

      return NextResponse.json(
        { message: "OTP sent to your email.", email, nextStep: "verifyOtp" },
        { status: 200 }
      );
    } else if (authType === "register") {
      // Name is now required for registration as per the form
      if (!name) {
        return NextResponse.json(
          { error: "Full name is required for registration." },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // If user exists but is not verified, you might want to resend OTP logic here
        if (!existingUser.isVerified) {
          await sendOtp(existingUser.email); // Resend OTP if user exists but unverified
          return NextResponse.json(
            {
              error:
                "Account already exists but not verified. A new OTP has been sent. Please check your email and proceed to verification.",
              message: "A new OTP has been sent to your email.", // Friendly message
              nextStep: "verifyOtp", // Indicate next step is verification
              email: existingUser.email, // Pass email for OTP step
            },
            { status: 409 }
          ); // Use 409 Conflict as resource exists but state needs resolution
        }
        return NextResponse.json(
          {
            error:
              "User with this email already exists and is verified. Please log in.",
          },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user with all provided data
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone || null, // Optional
          gender: gender || null, // NEW: Optional
          birthDate: birthDate ? new Date(birthDate) : null, // NEW: Convert to Date or null
          role: Role.BUYER, // Default role
          isVerified: false, // Set to false, to be verified by OTP
          // OTP code and expiry will be handled by sendOtp and verifyOtp
        },
      });

      // Send OTP after user creation
      await sendOtp(newUser.email);

      return NextResponse.json(
        {
          message:
            "OTP sent to your email. Please verify to complete registration.",
          email: newUser.email,
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
  } catch (error: any) {
    console.error("Authentication initiation error:", error);
    if (error.message.includes("Failed to send OTP email")) {
      return NextResponse.json(
        {
          error: `Sign up initiated, but failed to send OTP: ${error.message}. Please try again later.`,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to initiate authentication. Please try again later." },
      { status: 500 }
    );
  }
}
