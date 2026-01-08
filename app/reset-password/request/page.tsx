"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type ResetStep = "input_credentials" | "input_otp";

type FormState = {
  email: string;
  otp?: string;
};

const ResetPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue, // For programmatically setting react-hook-form values (e.g., Select)
    getValues,
  } = useForm<FormState>();
  const [resendTimer, setResendTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [currentStep, setCurrentStep] =
    useState<ResetStep>("input_credentials");
  const [loading, setLoading] = useState(false);
  const emailWatcher = watch("email");

  const onSubmitCredentials = async (data: FormState) => {
    try {
      setLoading(true);
      const response = await fetch("/api/me/password/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "OTP has been sent to your email.",
        });
        setLoading(false);
        setOtpSent(true);
        setCurrentStep("input_otp");
        setResendTimer(60);
      } else {
        setLoading(false);
        // Handle error (e.g., show a notification)
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
        console.error("Failed to send OTP");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error sending OTP:", error);
    }
  };

  const handleVerifyOtp = async (data: FormState) => {
    try {
      setLoading(true);
      const response = await fetch("/api/me/password/forgot-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email, otp: data.otp }),
      });
      if (response.ok) {
        // OTP verified successfully, redirect to reset password page
        window.location.href = `/reset-password?email=${encodeURIComponent(
          data.email
        )}`;
        setLoading(false);
      } else {
        // Handle error (e.g., show a notification)
        toast({
          title: "Error",
          description: "Failed to verify OTP. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        console.error("Failed to verify OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const email = getValues("email");
      const response = await fetch("/api/me/password/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "OTP has been resent to your email.",
        });
        setResendTimer(60);
        setLoading(false);
      } else {
        // Handle error (e.g., show a notification)
        toast({
          title: "Error",
          description: "Failed to resend OTP. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        console.error("Failed to resend OTP");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
    }
  };

  const handleOTPChange = (value: string) => {
    setValue("otp", value);
  };

  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8 capitalize">
          {currentStep === "input_credentials"
            ? "Reset Password"
            : "Verify OTP"}
        </h2>

        {currentStep === "input_credentials" && (
          <form
            onSubmit={handleSubmit(onSubmitCredentials)}
            className="space-y-6"
          >
            {/* Email Input */}
            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required.",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email address.",
                    },
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? renderLoadingSpinner() : "Send OTP"}
            </Button>
          </form>
        )}

        {currentStep === "input_otp" && (
          <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-6">
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
                  })}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  maxLength={4}
                  onChange={handleOTPChange}
                  onComplete={async (val: string) => {
                    // ensure react-hook-form value is synced
                    setValue("otp", val);

                    // require email to be present
                    const email = emailWatcher || getValues("email");
                    if (!email) {
                      toast({
                        title: "Missing Email",
                        description:
                          "Please enter your email before verifying OTP.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // call verify handler with an object matching FormState
                    await handleVerifyOtp({ email, otp: val });
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {errors.otp && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.otp.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading && renderLoadingSpinner()}
              Verify OTP
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
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
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

export default ResetPassword;
