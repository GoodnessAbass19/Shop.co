"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/Hooks/use-toast";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type FormState = {
  password: string;
  confirmPassword: string;
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
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmitCredentials = async (data: FormState) => {
    setLoading(true);
    try {
      if (data.password !== data.confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const response = await fetch("/api/me/password/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password: data.password }),
      });
      if (response.ok) {
        setLoading(false);
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        });
        router.push("/sign-in");
      } else {
        // Handle error (e.g., show a notification)
        toast({
          title: "Error",
          description: "Failed to reset password. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        console.error("Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-4 capitalize">
          Set New Password
        </h2>

        <form
          onSubmit={handleSubmit(onSubmitCredentials)}
          className="space-y-6"
        >
          <p className="text-sm text-center text-gray-600 mb-6">
            Please enter your new password below to reset it.
          </p>
          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
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
                    value: 8,
                    message: "Password must be at least 8 characters.",
                  },

                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                    message: "Include uppercase, lowercase and a number.",
                  },
                })}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none focus:ring-0"
                onClick={() => setIsPasswordShown(!isPasswordShown)}
                aria-label={isPasswordShown ? "Hide password" : "Show password"}
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

          <div>
            <Label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </Label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
              <Input
                id="confirmPassword"
                type={isConfirmPasswordShown ? "text" : "password"}
                placeholder="********"
                {...register("confirmPassword", {
                  required: "Confirm password is required.",
                  // minLength: {
                  //   value: 8,
                  //   message: "Password must be at least 8 characters.",
                  // },
                  validate: (v) =>
                    v === getValues("password") || "Passwords must match",
                })}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none focus:ring-0"
                onClick={() =>
                  setIsConfirmPasswordShown(!isConfirmPasswordShown)
                }
                aria-label={
                  isConfirmPasswordShown ? "Hide password" : "Show password"
                }
              >
                {isConfirmPasswordShown ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? renderLoadingSpinner() : null}
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
