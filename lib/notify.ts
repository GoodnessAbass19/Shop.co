import nodemailer from "nodemailer";
import twilio from "twilio";

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

const mailer = nodemailer.createTransport({
  host: SMTP_HOST || "smtp.ethereal.email",
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

const sms = twilio(TWILIO_SID!, TWILIO_AUTH_TOKEN!);

export async function sendBuyerDeliveryCodeEmail(
  to: string,
  buyerName: string,
  code: string,
  itemName: string
) {
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
  await sms.messages.create({
    to: toPhoneE164,
    from: TWILIO_PHONE!,
    body: `Your ${itemName} delivery code is ${code}. Share only with the rider on arrival.`,
  });
}

export async function sendStatusEmail(
  to: string,
  subject: string,
  bodyHtml: string
) {
  await mailer.sendMail({ from: SMTP_FROM, to, subject, html: bodyHtml });
}

export async function sendStatusSMS(toPhoneE164: string, body: string) {
  await sms.messages.create({ to: toPhoneE164, from: TWILIO_PHONE!, body });
}
