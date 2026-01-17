// lib/otp.ts
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import crypto from "crypto";
import prisma from "./prisma";
import { hashCode } from "./delivery";

export async function sendOtp(email: string) {
  const otp = crypto.randomInt(1000, 10000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 mins

  // --- Correction 1: createdAt for upsert ---
  // In upsert, `createdAt` in `update` block is usually not needed/desired
  // if you're using `@default(now())` and `@updatedAt` in your schema.
  // Prisma will automatically update `updatedAt` for `update` operations.
  // `createdAt` should only be set on `create`.
  const hash = await hashCode(otp);
  await prisma.otpToken.upsert({
    where: { email },
    update: {
      token: otp,
      expiresAt,
      tokenHash: hash,
      // createdAt: new Date(), // REMOVED: Prisma's @updatedAt will handle this.
      // If you want to reset creation time on update, reconsider this logic.
      // Usually, createdAt is immutable.
    },
    create: {
      email,
      token: otp,
      expiresAt,
      tokenHash: hash,
      // createdAt: new Date(), // This is redundant if you use @default(now()) in Prisma schema
      // but harmless.
    },
  });

  let transporter;
  let fromAddress: string | undefined;

  if (process.env.NODE_ENV === "production") {
    // ✅ Production: Use Gmail OAuth2 or other provider
    // --- Correction 2: Better error handling/type safety for env vars ---
    // Use optional chaining and nullish coalescing or throw errors if crucial env vars are missing.
    // For `createTransport`, types might expect strings, so `!` asserts non-null.
    if (
      !process.env.EMAIL_USER ||
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_REFRESH_TOKEN ||
      !process.env.EMAIL_PASSWORD
    ) {
      throw new Error(
        "Missing required environment variables for Gmail OAuth2 in production mode.",
      );
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        // type: "OAuth2",
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
        // clientId: process.env.GOOGLE_CLIENT_ID,
        // clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });
    fromAddress = process.env.EMAIL_FROM ?? process.env.EMAIL_USER ?? undefined;
  } else {
    // ✅ Development: Use Ethereal
    // --- Correction 3: Await for createTestAccount outside transporter init ---
    // nodemailer.createTestAccount() is async and needs to be awaited before
    // its result (testAccount) is used in createTransport.
    let testAccount;
    try {
      testAccount = await nodemailer.createTestAccount();
    } catch (err) {
      console.error(
        "Failed to create Ethereal test account. Check network or nodemailer setup.",
        err,
      );
      throw new Error(
        "Could not create Ethereal test account for development email.",
      );
    }

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // Ethereal is not secure with SSL/TLS, but uses STARTTLS on port 587
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    fromAddress = testAccount.user;
  }

  // --- Correction 4: Error handling for sendMail ---
  try {
    const info = await transporter.sendMail({
      from:
        fromAddress ??
        process.env.EMAIL_FROM ??
        (process.env.EMAIL_USER
          ? process.env.EMAIL_USER
          : "no-reply@yourstore.com"),
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP is: <strong>${otp}</strong></p>
             <p>This code expires in 10 minutes. Do not share it.</p>`,
    });

    // For local debugging
    if (process.env.NODE_ENV !== "production") {
      console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
      console.log("Ethereal info:", info);
    }

    console.log(`OTP sent to ${email}: ${otp}`);
    // Optional: Return true or some status on success
    return true;
  } catch (mailError) {
    console.error("Email transport error:", mailError);
    // Re-throw the error or return false/error object
    throw new Error(
      `Failed to send OTP email: ${
        mailError instanceof Error ? mailError.message : String(mailError)
      }`,
    );
  }
}

export async function verifyOtp(email: string, token: string) {
  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      email,
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otpRecord) {
    throw new Error(
      "Invalid or expired OTP. Please try again or request a new one.",
    );
  }

  await prisma.otpToken.delete({ where: { id: otpRecord.id } });
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  return transporter.sendMail({
    from: '"YourStore" <no-reply@yourstore.com>',
    to,
    subject,
    html,
  });
}

export function DeliveryCodeEmail({
  name,
  code,
}: {
  name: string;
  code: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Hi ${name},</h2>
      <p>Your order is out for delivery 🚚</p>
      <p>Please give the delivery confirmation code below to the rider upon receiving your package:</p>
      <h3 style="color: #111; background: #f0f0f0; padding: 10px; width: fit-content;">${code}</h3>
      <p>Thank you for shopping with us!</p>
      <p>- The YourStore Team</p>
    </div>
  `;
}
