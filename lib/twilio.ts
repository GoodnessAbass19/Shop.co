const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

export const sendSMS = async ({
  to,
  message,
}: {
  to: string;
  message: string;
}) => {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE!,
    to,
  });
};
