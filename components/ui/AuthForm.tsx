// components/auth/AuthFormWithOtp.tsx
"use client";

import { useForm } from "react-hook-form";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  CircleUser,
} from "lucide-react"; // Icons
import Link from "next/link";
import { useToast } from "@/Hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { HoverPrefetchLink } from "@/lib/HoverLink";

type AuthFormProps = {
  type: "login" | "register";
};

// Define the shape of your form data. Keep it aligned with your backend.
type FormState = {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  gender?: string; // NEW: Gender field
  birthDate?: string; // NEW: BirthDate field (as string from HTML date input)
  otp?: string;
};

type AuthStep = "input_credentials" | "input_otp";

export default function AuthForm({ type }: AuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue, // For programmatically setting react-hook-form values (e.g., Select)
    getValues,
  } = useForm<FormState>();

  const [currentStep, setCurrentStep] = useState<AuthStep>("input_credentials");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const { toast } = useToast();

  const emailWatcher = watch("email");

  const handleInitiateAuth = async (data: FormState) => {
    setLoading(true);

    const redirect_url = searchParams.get("redirectUrl") || "/";

    try {
      const payload = {
        email: data.email,
        password: data.password,
        authType: type,
        redirect_url,
        ...(type === "register" && {
          name: data.name,
          phone: data.phone,
          gender: data.gender, // NEW: Include gender
          birthDate: data.birthDate, // NEW: Include birthDate
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
        toast({
          title: "OTP Sent!",
          description:
            result.message ||
            "Please check your email for the verification code.",
          action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: result.error || "Failed to initiate authentication.",
          variant: "destructive",
          action: <ToastAction altText="Try again">Dismiss</ToastAction>,
        });
      }
    } catch (error) {
      console.error("Initiate Auth Error:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Dismiss</ToastAction>,
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleResendOtp = async () => {
    setLoading(true);

    const email = emailWatcher;
    const password = getValues("password");

    if (!email) {
      toast({
        title: "Missing Email",
        description: "Please go back and enter your email first.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/initial-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          authType: type,
          password,
          // Re-include all registration-specific data for resend, as the backend initiate-auth might need it
          ...(type === "register" && {
            name: getValues("name"),
            phone: getValues("phone"),
            gender: getValues("gender"),
            birthDate: getValues("birthDate"),
          }),
        }),
      });

      const result = await res.json();

      if (res.ok && result.nextStep === "verifyOtp") {
        toast({
          title: "OTP Resent!",
          description:
            result.message || "A new OTP has been sent. Check your email.",
          action: <ToastAction altText="OK">Dismiss</ToastAction>,
        });
      } else {
        toast({
          title: "Resend Failed",
          description: result.error || "Failed to resend OTP.",
          variant: "destructive",
          action: <ToastAction altText="Try again">Dismiss</ToastAction>,
        });
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      toast({
        title: "Network Error",
        description:
          "Could not connect to the server during OTP resend. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Dismiss</ToastAction>,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          {type === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        {currentStep === "input_credentials" && (
          <form
            onSubmit={handleSubmit(handleInitiateAuth)}
            className="space-y-6"
          >
            {type === "register" && (
              <>
                <div>
                  <Label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </Label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      {...register("name", {
                        required: "Full name is required.",
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </Label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+2348012345678"
                      {...register("phone", {
                        pattern: {
                          value: /^\+?[0-9\s-()]{7,20}$/,
                          message: "Invalid phone number format.",
                        },
                      })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                {/* NEW: Gender Select */}
                <div>
                  <Label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Gender
                  </Label>
                  <div className="relative flex items-center">
                    <CircleUser className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                    <Select
                      onValueChange={(value) => setValue("gender", value)}
                      value={watch("gender") || ""} // Ensure controlled component
                    >
                      <SelectTrigger className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* NEW: Birth Date Input */}
                <div>
                  <Label
                    htmlFor="birthDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Birth Date
                  </Label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="birthDate"
                      type="date"
                      {...register("birthDate")}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                    />
                  </div>
                </div>
              </>
            )}

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
            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={isPasswordShown ? "text" : "password"}
                  placeholder="********"
                  {...register("password", {
                    required: "Password is required.",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters.",
                    },
                  })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setIsPasswordShown(!isPasswordShown)}
                  aria-label={
                    isPasswordShown ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordShown ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
              className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading && renderLoadingSpinner()}
              {type === "login" ? "Login" : "Sign Up"}
            </Button>

            <p className="mt-4 text-center text-sm text-gray-600">
              {type === "login" ? (
                <>
                  Don't have an account?{" "}
                  <HoverPrefetchLink
                    href="/sign-up"
                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Sign up
                  </HoverPrefetchLink>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <HoverPrefetchLink
                    href="/sign-in"
                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Login
                  </HoverPrefetchLink>
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
              A One-Time Password (OTP) has been sent to{" "}
              <span className="font-medium text-gray-800">{emailWatcher}</span>.
              Please enter it below.
            </p>
            <div>
              <Label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter OTP
              </Label>
              <div className="relative flex items-center">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 text-center text-2xl font-bold tracking-widest"
                />
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

            <Button
              type="button"
              variant="ghost"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-gray-600 hover:text-gray-900 px-4 py-3 transition duration-200"
            >
              {loading && renderLoadingSpinner()}
              Resend OTP
            </Button>

            <p className="mt-4 text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep("input_credentials");
                  setValue("otp", "");
                }}
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
