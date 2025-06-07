"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui button
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui input
import { Label } from "@/components/ui/label"; // Assuming shadcn/ui label

// For the spinner icon (assuming Lucide Icons)
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

type AuthFormProps = {
  type: "login" | "register";
};

type FormState = {
  email: string;
  password?: string; // Optional for login if passwordless login desired
  name?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isSeller?: boolean;
  otp?: string;
};

type AuthStep = "input_credentials" | "input_otp";

export default function AuthFormWithOtp({ type }: AuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormState>();
  const [currentStep, setCurrentStep] = useState<AuthStep>("input_credentials");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isShown, setIsShown] = useState(false); // For password visibility toggle

  const emailWatcher = watch("email"); // Watch email to pre-fill OTP form

  const handleInitiateAuth = async (data: FormState) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const redirect_url = searchParams.get("redirectUrl") || "/orders"; // Default redirect

    try {
      const payload = {
        email: data.email,
        password: data.password,
        authType: type,
        redirect_url, // Pass redirect_url to API
        // Include registration-specific fields if it's a register flow
        ...(type === "register" && {
          name: data.name,
          phone: data.phone,
          address: data.address,
          isSeller: data.isSeller,
        }),
      };

      const res = await fetch("/api/initial-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.nextStep === "verifyOtp") {
        setCurrentStep("input_otp");
        setSuccessMessage(
          result.message || "OTP sent successfully. Please check your email."
        );
      } else {
        setErrorMessage(result.error || "Failed to initiate authentication.");
      }
    } catch (error) {
      console.error("Initiate Auth Error:", error);
      setErrorMessage("Network error or unexpected issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (data: FormState) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const redirect_url = searchParams.get("redirectUrl") || "/orders"; // Ensure redirect_url is passed

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
        setSuccessMessage("Authentication successful! Redirecting...");
        router.push(result.redirect_url || "/"); // Redirect to the specified URL
      } else {
        setErrorMessage(result.error || "OTP verification failed.");
      }
    } catch (error) {
      console.error("OTP Verify Error:", error);
      setErrorMessage(
        "Network error or unexpected issue during OTP verification. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = emailWatcher; // Get email from the watched field

    if (!email) {
      setErrorMessage("Please go back and enter your email first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/initial-auth", {
        // Re-use initiate-auth for resend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          authType: type,
          password: watch("password"),
        }), // Pass password again if login
      });

      const result = await res.json();

      if (res.ok && result.nextStep === "verifyOtp") {
        setSuccessMessage(
          result.message || "New OTP sent successfully. Check your email."
        );
      } else {
        setErrorMessage(result.error || "Failed to resend OTP.");
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      setErrorMessage(
        "Network error or unexpected issue during OTP resend. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render a loading spinner
  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01]">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          {type === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        {errorMessage && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {currentStep === "input_credentials" && (
          <form
            onSubmit={handleSubmit(handleInitiateAuth)}
            className="space-y-6"
          >
            {type === "register" && (
              <>
                <div>
                  <Label htmlFor="name">Username</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...register("name", { required: "Username is required." })}
                    className="w-full mt-1"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+2348012345678"
                    {...register("phone", {
                      required: "Phone number is required.",
                    })}
                    className="w-full mt-1"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required.",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address.",
                  },
                })}
                className="w-full mt-1"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative flex rounded-md border border-gray-300 focus:border-secondary w-full">
                <input
                  id="password"
                  type={isShown ? "text" : "password"}
                  placeholder="Password"
                  {...register("password", { required: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-500 transition duration-200"
                />

                <button
                  type="button"
                  className="absolute outline-none right-2 top-0 bottom-0 text-sm text-primary p-2"
                  onClick={() => setIsShown(!isShown)}
                >
                  {isShown ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? renderLoadingSpinner() : null}
              {type === "login" ? "Login" : "Sign Up"}
            </Button>

            <p className="mt-4 text-center text-sm text-gray-600">
              {type === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="font-medium text-gray-900 hover:text-gray-700"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="font-medium text-gray-900 hover:text-gray-700"
                  >
                    Login
                  </Link>
                </>
              )}
            </p>
          </form>
        )}

        {currentStep === "input_otp" && (
          <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-6">
            <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4">
              Verify Your Email
            </h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              An OTP has been sent to{" "}
              <span className="font-medium text-gray-800">{emailWatcher}</span>.
              Please enter it below.
            </p>
            <div>
              <Label htmlFor="otp">One-Time Password (OTP)</Label>
              <Input
                id="otp"
                type="text"
                placeholder="XXXXXX"
                maxLength={6}
                {...register("otp", {
                  required: "OTP is required.",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "OTP must be 6 digits.",
                  },
                })}
                className="w-full mt-1 text-center text-xl tracking-widest"
              />
              {errors.otp && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.otp.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? renderLoadingSpinner() : null}
              Verify OTP
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-gray-600 hover:text-gray-900"
            >
              {loading ? renderLoadingSpinner() : null}
              Resend OTP
            </Button>

            <p className="mt-4 text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep("input_credentials");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setValue("otp", ""); // Clear OTP field
                }}
                className="font-medium text-gray-900 hover:text-gray-700"
              >
                Go back to credentials
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
