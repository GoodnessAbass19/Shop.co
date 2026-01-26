"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/Hooks/use-toast";
import { ToastAction } from "../ui/toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { User } from "@prisma/client";
import { set } from "date-fns";

interface SellerStoreData {
  store: {
    id: string;
    contactEmail: string;
    userId: string;
    user: User;
    isActive: boolean;
  };
}

const fetchStoreAuthData = async (): Promise<SellerStoreData> => {
  // Assuming a lightweight API endpoint that only returns contact details and status
  const res = await fetch("/api/store");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch store data for auth.");
  }
  return res.json();
};

type EmailFormState = {
  email: string;
};

type OTPFormState = {
  otp: string;
};

const AdminVerificationForm = ({
  storeToken,
}: {
  storeToken?: string | undefined;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [currentStep, setCurrentStep] = useState<"email" | "otp">("email");
  const [verificationEmail, setVerificationEmail] = useState("");

  const redirect_url = searchParams.get("redirectUrl") || "/admin/dashboard";

  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    formState: emailFormState,
  } = useForm<EmailFormState>({
    defaultValues: { email: "" },
  });

  const {
    control: otpControl,
    handleSubmit: handleOtpSubmit,
    setError: setOtpError,
    clearErrors: clearOtpErrors,
  } = useForm<OTPFormState>({
    defaultValues: { otp: "" },
  });

  const otpValue = useWatch({ control: otpControl, name: "otp" });

  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  // --- API Handlers ---

  const sendOtp = async (email: string) => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email is required to send OTP.",
        variant: "destructive",
      });
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resendOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed to send OTP.");

      setOtpSent(true);
      setResendTimer(60);
      setVerificationEmail(email);
      setCurrentStep("otp");
      toast({
        title: "OTP Sent",
        description: `A One-Time Password has been sent to ${email}.`,
        action: <ToastAction altText="Okay">Dismiss</ToastAction>,
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please check server status.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmission = async (formData: EmailFormState) => {
    await sendOtp(formData.email);
  };

  const handleVerifyOtp = async (formData: OTPFormState) => {
    clearOtpErrors("otp");

    if (!verificationEmail) {
      toast({
        title: "Error",
        description: "Email not available. Cannot verify OTP.",
        variant: "destructive",
      });
      return;
    }

    const otpValue = formData.otp?.toString().trim() || "";
    if (otpValue.length !== 4) {
      setOtpError("otp", { type: "manual", message: "OTP must be 4 digits." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, otp: otpValue }),
        credentials: "include",
      });

      // Attempt to parse JSON safely
      let result: any = {};
      try {
        result = await res.json();
      } catch (e) {
        // ignore JSON parse errors and fall through to error handling
      }

      if (res.ok && result?.success) {
        setLoading(false);
        toast({
          title: "Success!",
          description:
            result.message || "Authentication successful! Redirecting...",
          action: <ToastAction altText="Go to Dashboard">Dismiss</ToastAction>,
        });
        // Wait for navigation to complete
        if (redirect_url) {
          await router.push(redirect_url);
        }

        return;
      }

      // Mark field error and show toast on failure
      const errMsg =
        result?.error || "OTP verification failed. Please try again.";
      setOtpError("otp", { type: "manual", message: errMsg });
      toast({
        title: "Verification Failed",
        description: errMsg,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("OTP Verify Error:", error);
      toast({
        title: "Network Error",
        description:
          "Could not connect to the server during OTP verification. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Dismiss</ToastAction>,
      });
    }
  };

  // Resend Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && timer) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-5 border border-gray-200">
        {currentStep === "email" ? (
          // STEP 1: Email Input
          <form
            onSubmit={handleEmailSubmit(handleEmailSubmission)}
            className="space-y-5"
          >
            <h3 className="text-lg md:text-2xl font-semibold text-center text-gray-800 mb-4">
              Admin Access Verification
            </h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              Enter your email address to receive a One-Time Password (OTP).
            </p>

            <div className="flex flex-col space-y-2">
              <Label
                htmlFor="email-input"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </Label>
              <Controller
                name="email"
                control={emailControl}
                rules={{
                  required: "Email is required.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address.",
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <div>
                    <Input
                      id="email-input"
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                      className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                        error ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {error && (
                      <p className="text-red-500 text-xs mt-1">
                        {error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || emailFormState.isSubmitting}
              className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? renderLoadingSpinner() : "Send OTP"}
            </Button>
          </form>
        ) : (
          // STEP 2: OTP Input
          <form
            onSubmit={handleOtpSubmit(handleVerifyOtp)}
            className="space-y-5"
          >
            <div className="flex items-center mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentStep("email");
                  setOtpSent(false);
                  setVerificationEmail("");
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4">
              Verify OTP
            </h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              A One-Time Password (OTP) has been sent to{" "}
              <span className="font-medium text-gray-800">
                {verificationEmail}
              </span>
              . Please enter it below.
            </p>

            <div className="flex flex-col justify-center items-center space-y-2">
              <Label
                htmlFor="otp-input"
                className="block text-sm font-medium text-gray-700"
              >
                Enter OTP
              </Label>
              <Controller
                name="otp"
                control={otpControl}
                rules={{
                  required: "OTP is required.",
                  minLength: { value: 4, message: "OTP must be 4 digits." },
                }}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-col items-center">
                    <InputOTP
                      id="otp-input"
                      maxLength={4}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      onComplete={async (val: string) => {
                        await handleVerifyOtp({ otp: val });
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-10 h-10" />
                        <InputOTPSlot index={1} className="w-10 h-10" />
                        <InputOTPSlot index={2} className="w-10 h-10" />
                        <InputOTPSlot index={3} className="w-10 h-10" />
                      </InputOTPGroup>
                    </InputOTP>
                    {error && (
                      <p className="text-red-500 text-xs mt-2">
                        {error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otpValue.length < 4}
              className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? renderLoadingSpinner() : "Continue to Dashboard"}
            </Button>

            <div className="text-center text-sm mt-4">
              {resendTimer > 0 ? (
                <p>
                  Resend code in{" "}
                  <span className="font-bold">{resendTimer}s</span>
                </p>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-gray-600 hover:text-gray-900 px-4 py-3 transition duration-200"
                  onClick={() => sendOtp(verificationEmail)}
                  disabled={loading}
                >
                  Resend Code
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminVerificationForm;
