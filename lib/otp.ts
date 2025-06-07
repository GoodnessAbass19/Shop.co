// lib/otp.ts (Recommended Update)
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import crypto from "crypto";

const prisma = new PrismaClient();

// Ensure these environment variables are set in your .env.local file:
// EMAIL_USER="your_email@gmail.com"
// EMAIL_PASS="your_app_password" // For Gmail, use an App Password, not your regular account password

export async function sendOtp(email: string) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Using upsert to handle cases where an OTP already exists for the email
  await prisma.otpToken.upsert({
    where: { email }, // Check if an OTP for this email already exists
    update: {
      token: otp,
      expiresAt,
      createdAt: new Date(), // Update creation time to reset expiry window
    },
    create: {
      email,
      token: otp,
      expiresAt,
    },
  });

  // Configure your email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      // type: "OAuth2",
      user: process.env.EMAIL_USER, // Use environment variable
      pass: process.env.EMAIL_PASSWORD,
      // clientId: process.env.GOOGLE_CLIENT_ID!,
      // clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("Email transport error:", error);
    } else {
      console.log("Server is ready to take messages");
    }
  });
  // Send the email
  await transporter.sendMail({
    from: process.env.EMAIL_USER, // Use environment variable
    to: email,
    subject: "Your OTP Code for [YourAppName]", // Consider adding your app name
    html: `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
           <p>This code will expire in 10 minutes. Do not share it with anyone.</p>
           <p>If you did not request this, please ignore this email.</p>`,
  });

  console.log(`OTP sent to ${email}: ${otp}`); // For debugging, remove in production
}

export async function verifyOtp(email: string, token: string) {
  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      email,
      token,
      expiresAt: {
        gt: new Date(), // OTP must be greater than current time (not expired)
      },
    },
  });

  if (!otpRecord) {
    // It's good to be generic for security reasons (don't reveal if email is wrong or OTP is wrong)
    throw new Error(
      "Invalid or expired OTP. Please try again or request a new one."
    );
  }

  // OTP is valid and not expired; delete the record immediately
  await prisma.otpToken.delete({
    where: { id: otpRecord.id },
  });

  // No return value needed, success is implied if no error is thrown
}
