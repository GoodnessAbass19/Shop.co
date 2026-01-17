// components/auth/OtpVerificationStep.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { Mail, Loader2, Hourglass } from "lucide-react"; // Icons
import { useMutation } from "@tanstack/react-query"; // For resending OTP
import { useToast } from "@/Hooks/use-toast";

interface StepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>; // You'll update OTP input here
  validationErrors: { [key: string]: string };
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  // Added properties for OTP context
  onOtpSent: (email: string) => void; // Callback to notify parent MultiStep form OTP sent
  onVerificationSuccess: () => void; // Callback to notify parent MultiStep form of success
}

export function OtpVerificationStep({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
  onOtpSent,
  onVerificationSuccess,
}: StepProps) {
  const { toast } = useToast();
  const [otpInput, setOtpInput] = useState("");
  const [countdown, setCountdown] = useState(60); // 60 seconds for resend
  const [canResend, setCanResend] = useState(false);

  // Use a ref to store the interval ID
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Countdown effect
  useEffect(() => {
    setCanResend(false); // Disable resend by default when component mounts
    setCountdown(60); // Reset countdown
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [formData.email]); // Restart countdown if email changes (implies new OTP sent)

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
    setOtpInput(value);
    if (validationErrors.otp) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.otp;
        return newErrors;
      });
    }
  };

  const resendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      // This endpoint should trigger a new OTP generation and send it
      // Make sure your /api/auth/sign-up or a dedicated /api/auth/resend-otp handles this.
      const res = await fetch("/api/auth/sign-up", {
        // Re-using sign-up route to resend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resend: true }), // Add a flag to indicate resend
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to resend OTP.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Resent!",
        description: "A new OTP has been sent to your email.",
      });
      setCanResend(false);
      setCountdown(60); // Restart countdown
      // Clear previous interval and start a new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Resend Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResendOtp = () => {
    if (canResend && !resendOtpMutation.isPending) {
      resendOtpMutation.mutate(formData.email);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-700 text-lg mb-4">
        A 6-digit OTP has been sent to{" "}
        <span className="font-semibold text-blue-600">{formData.email}</span>.
        Please enter it below to verify your account.
      </p>

      <div>
        <Label
          htmlFor="otp"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Enter OTP <span className="text-red-500">*</span>
        </Label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            id="otp"
            name="otp"
            type="text"
            value={otpInput}
            onChange={handleOtpInputChange}
            placeholder="XXXXXX"
            maxLength={6}
            required
            className={`w-full pl-10 pr-3 py-2 border rounded-md text-center text-xl font-bold tracking-widest ${
              validationErrors.otp ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
        {validationErrors.otp && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.otp}</p>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
        {canResend ? (
          <Button
            variant="link"
            onClick={handleResendOtp}
            disabled={resendOtpMutation.isPending}
            className="text-blue-600 hover:text-blue-800 p-0 h-auto"
          >
            {resendOtpMutation.isPending ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              "Resend OTP"
            )}
          </Button>
        ) : (
          <span className="flex items-center">
            <Hourglass className="h-4 w-4 mr-1" /> Resend in {countdown}s
          </span>
        )}
      </div>
    </div>
  );
}
