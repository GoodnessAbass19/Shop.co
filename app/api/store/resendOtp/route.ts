import { sendOtp } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
      });
    }
    await sendOtp(email);

    return new Response(
      JSON.stringify({ message: "OTP resent successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
