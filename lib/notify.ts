import nodemailer from "nodemailer";
import twilio, { Twilio } from "twilio";

// Destructure environment variables
const {
  SMTP_HOST,
  SMTP_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  SMTP_FROM,
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE,
} = process.env;

// Check for required email credentials
let mailer: nodemailer.Transporter | null = null;
if (EMAIL_USER && EMAIL_PASS) {
  try {
    mailer = nodemailer.createTransport({
      host: SMTP_HOST || "smtp.ethereal.email",
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
  } catch (e) {
    console.error("Failed to initialize Nodemailer transport:", e);
  }
} else {
  console.warn(
    "Nodemailer not initialized: Missing EMAIL_USER or EMAIL_PASS environment variables."
  );
}

// Check for required Twilio credentials
let sms: Twilio | null = null;
if (TWILIO_SID && TWILIO_AUTH_TOKEN) {
  try {
    // The Twilio function already throws if credentials are bad, so we assert !
    sms = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
  } catch (e) {
    console.error("Failed to initialize Twilio client:", e);
  }
} else {
  console.warn(
    "Twilio not initialized: Missing TWILIO_SID or TWILIO_AUTH_TOKEN environment variables."
  );
}

export async function sendBuyerDeliveryCodeEmail(
  to: string,
  buyerName: string,
  code: string,
  itemName: string
) {
  if (!mailer || !SMTP_FROM) {
    console.error(
      `Email notification skipped: Mailer not configured or SMTP_FROM is missing. Tried to send code ${code} to ${to}.`
    );
    return; // Exit if mailer is not initialized
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:640px;margin:0 auto;padding:24px">
      <h2>Your delivery confirmation code</h2>
      <p>Hi ${buyerName || "there"},</p>
      <p>Your code for <strong>${itemName}</strong> is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0">${code}</div>
      <p>Please give this code to the rider when your item arrives.</p>
      <p style="color:#666">If you didn’t request this, please contact support.</p>
    </div>
  `;

  await mailer.sendMail({
    from: SMTP_FROM,
    to,
    subject: "Your delivery confirmation code",
    html,
  });
}

export async function sendBuyerDeliveryCodeSMS(
  toPhoneE164: string,
  code: string,
  itemName: string
) {
  // We need both the client and the sender phone number
  if (!sms || !TWILIO_PHONE) {
    console.error(
      `SMS notification skipped: Twilio client not configured or TWILIO_PHONE is missing. Tried to send code ${code} to ${toPhoneE164}.`
    );
    return; // Exit if Twilio is not initialized
  }

  await sms.messages.create({
    to: toPhoneE164,
    from: TWILIO_PHONE, // Asserted to be defined in the check above
    body: `Your ${itemName} delivery code is ${code}. Share only with the rider on arrival.`,
  });
}

export async function sendStatusEmail(
  to: string,
  subject: string,
  bodyHtml: string
) {
  if (!mailer || !SMTP_FROM) {
    console.error(
      `Status Email notification skipped: Mailer not configured or SMTP_FROM is missing. Tried to send status email to ${to}.`
    );
    return;
  }
  await mailer.sendMail({ from: SMTP_FROM, to, subject, html: bodyHtml });
}

export async function sendStatusSMS(toPhoneE164: string, body: string) {
  // We need both the client and the sender phone number
  if (!sms || !TWILIO_PHONE) {
    console.error(
      `Status SMS notification skipped: Twilio client not configured or TWILIO_PHONE is missing. Tried to send status SMS to ${toPhoneE164}.`
    );
    return;
  }
  await sms.messages.create({ to: toPhoneE164, from: TWILIO_PHONE, body });
}
