"use client";

import { useSellerStore } from "@/Hooks/use-store-context";
import { Label } from "../ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/Hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ToastAction } from "../ui/toast";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Role,
  Product,
  ProductVariant,
  Category,
  SubCategory,
  SubSubCategory,
  OrderItem,
  Order,
  Address,
  Contact,
  CustomerCare,
  BusinessInfo,
  ShippingInfo,
} from "@prisma/client";
import { SellerStoreProvider } from "@/Hooks/use-store-context";

type FormState = {
  email: string;
  otp?: string;
};

interface SellerStoreData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banners: string[];
  contactEmail: string;
  country: string;
  state: string;
  contactPhone: string;
  accountType: string;
  contact: Contact;
  customerCare: CustomerCare;
  businessInfo: BusinessInfo | null;
  shippingInfo: ShippingInfo;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
  products: (Product & {
    variants: ProductVariant[];
    category: Category;
    subCategory: SubCategory | null;
    subSubCategory: SubSubCategory | null;
  })[];
  orderItems: (OrderItem & {
    order: Order & {
      buyer: User;
      address: Address;
    };
  })[];
}

// Function to fetch seller's store data
const fetchSellerStore = async (): Promise<{ store: SellerStoreData }> => {
  const res = await fetch("/api/store"); // Your API endpoint
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch seller store data.");
  }
  return res.json();
};

const VerificationForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormState>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [resendTimer, setResendTimer] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [otp, setOtp] = useState("");

  // Fetch seller's store data
  const { data, isLoading, isError, error } = useQuery<
    { store: SellerStoreData },
    Error
  >({
    queryKey: ["sellerStore"],
    queryFn: fetchSellerStore,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Retry once if it fails
  });

  const sellerStore = data?.store!;

  const handleResendOtp = async () => {
    if (!sellerStore?.contactEmail) {
      toast({
        title: "Error",
        description: "No contact email found for the store.",
        variant: "destructive",
        action: <ToastAction altText="Okay">Dismiss</ToastAction>,
      });
      return;
    }

    await fetch("/api/store/resendOtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sellerStore.contactEmail }),
    });
    setLoading(false);
    setOtpSent(true);
    setResendTimer(60);
    toast({
      title: "OTP Sent",
      description: "A new OTP has been sent to your email address.",
      action: <ToastAction altText="Okay">Dismiss</ToastAction>,
    });
  };

  useEffect(() => {
    handleResendOtp();
  }, []);

  const renderLoadingSpinner = () => (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  );

  const handleVerifyOtp = async (data: FormState) => {
    setLoading(true);

    const redirect_url = searchParams.get("redirectUrl") || "/";

    try {
      const res = await fetch("/api/store/verifyOtp", {
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

  // Handle loading state for the main store data
  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  if (sellerStore.user.isSeller) {
    router.push("/your/store/dashboard");
    return null;
  }

  return (
    <SellerStoreProvider store={sellerStore}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
          <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-5">
            <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4">
              Login
            </h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              A One-Time Password (OTP) has been sent to{" "}
              <span className="font-medium text-gray-800">
                {sellerStore.contactEmail}
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
                : "Continue to Dashboard"}
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
        </div>
      </div>
    </SellerStoreProvider>
  );
};

export default VerificationForm;
