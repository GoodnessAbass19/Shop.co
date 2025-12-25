"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Utility/Component Imports
import { useToast } from "@/Hooks/use-toast";
import { ToastAction } from "../ui/toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { User } from "@prisma/client";

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

type FormState = {
  // Use a string to capture the full 6-digit OTP value
  otp: string;
};

const VerificationForm = ({
  storeToken,
}: {
  storeToken?: string | undefined;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); // Initialize to 0 to allow immediate resend call
  const [otpSent, setOtpSent] = useState(false); // Tracks if OTP has been sent once

  // Fetch only the data required for this auth check
  const { data, isLoading, isError } = useQuery<SellerStoreData, Error>({
    queryKey: ["storeAuthData"],
    queryFn: fetchStoreAuthData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const contactEmail = data?.store.contactEmail ?? "";
  const isUserSeller = !!data?.store.user?.isSeller;
  const isActive = !!data?.store?.isActive;

  const redirect_url =
    searchParams.get("redirectUrl") || "/your/store/dashboard";

  const { control, handleSubmit, setError, clearErrors } = useForm<FormState>({
    defaultValues: { otp: "" },
  });

  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  // --- API Handlers ---

  const sendOtp = async () => {
    if (!contactEmail) {
      toast({
        title: "Error",
        description: "Store email not available. Cannot send OTP.",
        variant: "destructive",
      });
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/store/resendOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contactEmail }),
      });

      if (!res.ok) throw new Error("Failed to send OTP.");

      setOtpSent(true);
      setResendTimer(60);
      toast({
        title: "OTP Sent",
        description: `A new OTP has been sent to ${contactEmail}.`,
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

  const handleVerifyOtp = async (formData: FormState) => {
    clearErrors("otp");

    if (!contactEmail) {
      toast({
        title: "Error",
        description: "Store email not available. Cannot verify OTP.",
        variant: "destructive",
      });
      return;
    }

    const otpValue = formData.otp?.toString().trim() || "";
    if (otpValue.length !== 6) {
      setError("otp", { type: "manual", message: "OTP must be 6 digits." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/store/verifyOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contactEmail, otp: otpValue }),
      });

      // Attempt to parse JSON safely
      let result: any = {};
      try {
        result = await res.json();
      } catch (e) {
        // ignore JSON parse errors and fall through to error handling
      }

      if (res.ok && result?.success) {
        toast({
          title: "Success!",
          description:
            result.message || "Authentication successful! Redirecting...",
          action: <ToastAction altText="Go to Dashboard">Dismiss</ToastAction>,
        });
        // Wait for navigation to complete
        if (!isActive) {
          await router.push(`/your/store/dashboard/profile`);
        } else {
          await router.push(redirect_url);
        }

        return;
      }

      // Mark field error and show toast on failure
      const errMsg =
        result?.error || "OTP verification failed. Please try again.";
      setError("otp", { type: "manual", message: errMsg });
      toast({
        title: "Verification Failed",
        description: errMsg,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
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

  // --- Effects ---
  // 1. Send OTP on initial load
  useEffect(() => {
    // Only send OTP once, after data is loaded and only if it hasn't been sent
    if (!isLoading && contactEmail && !otpSent) {
      sendOtp();
    }
  }, [isLoading, contactEmail, otpSent]);

  // 2. Resend Timer
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

  // 3. Early Exit (Loading/Redirect)
  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
      </section>
    );
  }

  // 4. Early Redirect if user is already a seller
  if (isUserSeller && !!storeToken) {
    router.push(redirect_url);
    return null;
  }

  // 5. Error state if we couldn't fetch data
  if (isError || !contactEmail) {
    return (
      <section className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 border rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600">
            Authentication Required
          </h2>
          <p className="mt-2 text-gray-600">
            Could not retrieve store authentication details. Please ensure you
            are logged in as a store user.
          </p>
          <Button onClick={() => router.push("/sign-in")} className="mt-4">
            Go to Sign In
          </Button>
        </div>
      </section>
    );
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
        <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-5">
          <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4">
            Store Access Verification
          </h3>
          <p className="text-sm text-center text-gray-600 mb-6">
            A One-Time Password (OTP) has been sent to{" "}
            <span className="font-medium text-gray-800">{contactEmail}</span>.
            Please enter it below.
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
              control={control}
              rules={{
                required: "OTP is required.",
                minLength: { value: 6, message: "OTP must be 6 digits." },
              }}
              render={({ field }) => (
                <InputOTP
                  id="otp-input"
                  maxLength={4}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  onComplete={(val) => field.onChange(val)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-10 h-10" />
                    <InputOTPSlot index={1} className="w-10 h-10" />
                    <InputOTPSlot index={2} className="w-10 h-10" />
                    <InputOTPSlot index={3} className="w-10 h-10" />
                    {/* <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} /> */}
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            {/* Display React Hook Form error */}
            {/* {errors.otp && (
                <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p>
            )} */}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? renderLoadingSpinner() : "Continue to Dashboard"}
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
                onClick={sendOtp}
                disabled={loading}
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
