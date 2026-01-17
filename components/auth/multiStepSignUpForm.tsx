// components/auth/MultiStepSignUpForm.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { EmailPasswordStep } from "./EmailPasswordStep";
import { PersonalDetailsStep } from "./PersonalDetails";
import { ContactInfoStep } from "./ContactInfo";
import { OtpVerificationStep } from "./Otp";
import { useToast } from "@/Hooks/use-toast";

// Define the overall shape of the form data for sign-up
interface SignUpFormData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  gender?: string;
  birthDate?: string; // Stored as ISO string or date string from input
  otp?: string; // NEW: OTP input from the last step
}

export function MultiStepSignUpForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    name: "",
    phone: "",
    gender: "",
    birthDate: "",
    otp: "", // Initialize OTP field
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const steps = useMemo(
    () => [
      { title: "Account Details", component: EmailPasswordStep },
      { title: "Personal Info", component: PersonalDetailsStep },
      { title: "Contact Info", component: ContactInfoStep },
      { title: "Verify Email", component: OtpVerificationStep }, // Changed last step
    ],
    []
  );

  // State to hold user info after initial signup API call, for OTP verification
  const [unverifiedUserData, setUnverifiedUserData] = useState<{
    userId: string;
    email: string;
  } | null>(null);

  // Validation function for each step
  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      let errors: { [key: string]: string } = {};
      let isValid = true;

      if (stepIndex === 0) {
        // Email & Password
        if (!formData.email.trim()) {
          errors.email = "Email is required.";
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = "Invalid email format.";
          isValid = false;
        }
        if (!formData.password) {
          errors.password = "Password is required.";
          isValid = false;
        } else if (formData.password.length < 6) {
          errors.password = "Password must be at least 6 characters.";
          isValid = false;
        }
      } else if (stepIndex === 1) {
        // Personal Details
        if (!formData.name.trim()) {
          errors.name = "Full name is required.";
          isValid = false;
        }
      } else if (stepIndex === 2) {
        // Contact Info
        if (formData.phone && !/^\+?[0-9\s-()]{7,20}$/.test(formData.phone)) {
          errors.phone = "Invalid phone number format.";
          isValid = false;
        }
      } else if (stepIndex === 3) {
        // OTP Verification Step
        if (!formData.otp || formData.otp.length !== 6) {
          errors.otp = "Please enter the 6-digit OTP.";
          isValid = false;
        }
      }

      setValidationErrors(errors);
      return isValid;
    },
    [formData]
  );

  // Mutation for initial sign-up (creating unverified user and sending OTP)
  const initialSignUpMutation = useMutation({
    mutationFn: async (userData: SignUpFormData) => {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Sign up initiation failed.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setUnverifiedUserData({ userId: data.userId, email: data.email });
      toast({
        title: "OTP Sent!",
        description: data.message,
        action: <ToastAction altText="OK">Dismiss</ToastAction>,
      });
      // Move to the next step (OTP verification)
      setCurrentStep((prev) => prev + 1);
    },
    onError: (error: Error) => {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  // Mutation for OTP verification and final user sign-up/login
  const verifyOtpMutation = useMutation({
    mutationFn: async (otpData: { email: string; otp: string }) => {
      const res = await fetch("/api/auth/verify-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otpData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "OTP verification failed.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Successful!",
        description:
          data.message ||
          "Your account has been verified and you are now logged in!",
        action: <ToastAction altText="OK">Dismiss</ToastAction>,
      });
      router.push("/dashboard"); // Redirect to dashboard or home page after login
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        // If it's the step BEFORE OTP verification (i.e., step 2, Contact Info)
        if (currentStep === steps.length - 2) {
          // Index of ContactInfoStep (3rd step, index 2)
          initialSignUpMutation.mutate(formData); // Trigger initial sign-up API call
        } else {
          setCurrentStep((prev) => prev + 1); // Move to next step normally
        }
      } else {
        // This is the LAST step (OTP Verification)
        verifyOtpMutation.mutate({ email: formData.email, otp: formData.otp! });
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted fields before proceeding.",
        variant: "destructive",
        action: <ToastAction altText="Close">Dismiss</ToastAction>,
      });
    }
  }, [
    currentStep,
    steps.length,
    validateStep,
    formData,
    initialSignUpMutation,
    verifyOtpMutation,
    toast,
  ]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setValidationErrors({}); // Clear errors when going back
    }
  }, [currentStep]);

  const isSubmitting =
    initialSignUpMutation.isPending || verifyOtpMutation.isPending;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Sign Up: {steps[currentStep].title}
      </h2>

      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-8 relative px-4">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1 z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                  index === currentStep
                    ? "bg-blue-600 ring-4 ring-blue-200"
                    : index < currentStep
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              >
                {index < currentStep ? "✔" : index + 1}
              </div>
              <p
                className={`text-xs sm:text-sm mt-2 text-center transition-colors duration-300 ${
                  index === currentStep
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600"
                }`}
              >
                {step.title}
              </p>
            </div>
            {/* Conditional line segment between circles */}
            {index < steps.length - 1 && (
              <div
                className={`absolute h-0.5 bg-gray-200 z-0`}
                style={{
                  left: `calc(${(index / (steps.length - 1)) * 100}% + 20px)`, // Start after current dot
                  width: `calc(100% / ${steps.length - 1} - 40px)`, // Width of segment
                }}
              >
                <div
                  className={`h-full ${
                    index < currentStep ? "bg-green-500" : ""
                  } ${
                    index === currentStep ? "bg-blue-400 animate-pulse" : ""
                  }`}
                ></div>
              </div>
            )}
          </React.Fragment>
        ))}
        {/* Overall progress bar (hidden by individual segments if preferred) */}
        <div className="absolute top-[20px] left-1/2 transform -translate-x-1/2 w-[calc(100%-80px)] h-0.5 bg-gray-200 z-0">
          <div
            className={`h-full bg-blue-600 transition-all duration-500`}
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Current Step Content */}
      {(() => {
        const StepComponent = steps[currentStep].component;
        return (
          <StepComponent
            formData={formData}
            setFormData={setFormData}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            // Pass unverified user data and callbacks specifically to OtpVerificationStep
            onOtpSent={
              unverifiedUserData
                ? () => {}
                : (email: string) => {
                    /* this callback is technically not used here due to initialSignUpMutation handling it */
                  }
            }
            onVerificationSuccess={() => {
              /* this callback is also handled by verifyOtpMutation success */
            }}
          />
        );
      })()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center text-gray-700 hover:text-blue-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
        <div className="flex-grow flex justify-end">
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Submitting...
              </>
            ) : (
              <>
                {currentStep < steps.length - 1 ? "Next" : "Verify & Sign Up"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
