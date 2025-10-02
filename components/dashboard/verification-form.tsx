"ue client";

import { useSellerStore } from "@/Hooks/use-store-context";
import { Label } from "../ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/Hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ToastAction } from "../ui/toast";

type FormState = {
  email: string;
  otp?: string;
};

const VerificationForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormState>();
  const { store } = useSellerStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [resendTimer, setResendTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [otp, setOtp] = useState("");

  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  const handleVerifyOtp = async (data: FormState) => {
    setLoading(true);

    const redirect_url = searchParams.get("redirectUrl") || "/";

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          otp: data.otp,
          redirect_url,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setRedirect(true);
        toast({
          title: "Success!",
          description:
            result.message || "Authentication successful! Redirecting...",
          action: <ToastAction altText="Go to Dashboard">Dismiss</ToastAction>,
        });
        router.push(result.redirect_url || "/");
      } else {
        toast({
          title: "Verification Failed",
          description:
            result.error || "OTP verification failed. Please try again.",
          variant: "destructive",
          action: <ToastAction altText="Try again">Dismiss</ToastAction>,
        });
      }
    } catch (error) {
      console.error("OTP Verify Error:", error);
      toast({
        title: "Network Error",
        description:
          "Could not connect to the server during OTP verification. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Dismiss</ToastAction>,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (newValue: string) => {
    // handle the OTP value directly
    setOtp(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
        <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-5">
          <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4">
            Verify Your Email
          </h3>
          <p className="text-sm text-center text-gray-600 mb-6">
            A One-Time Password (OTP) has been sent to{" "}
            <span className="font-medium text-gray-800">
              {store.contactEmail}
            </span>
            . Please enter it below.
          </p>

          <div className="flex flex-col justify-center items-center">
            <Label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter OTP
            </Label>
            <div className="relative flex items-center">
              <InputOTP
                id="otp"
                {...register("otp", {
                  required: "OTP is required.",
                  // pattern: {
                  //   value: /^\d{6}$/,
                  //   message: "OTP must be 6 digits.",
                  // },
                })}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                maxLength={6}
                onChange={handleOTPChange}
                // onComplete={handleVerifyOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading
              ? renderLoadingSpinner()
              : redirect
              ? "Redirecting..."
              : "Verify & Continue"}
          </Button>

          <div className="text-center text-sm mt-4">
            {resendTimer > 0 ? (
              <p>
                Resend code in <span className="font-bold">{resendTimer}s</span>
              </p>
            ) : (
              <Button
                type="button"
                variant="link"
                className="w-full text-gray-600 hover:text-gray-900 px-4 py-3 transition duration-200"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
              >
                Resend Code
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationForm;
