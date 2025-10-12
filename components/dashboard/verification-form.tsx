// "use client";

// import { Label } from "../ui/label";
// import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
// import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
// import { useForm } from "react-hook-form";
// import { Button } from "../ui/button";
// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useToast } from "@/Hooks/use-toast";
// import { Loader2 } from "lucide-react";
// import { ToastAction } from "../ui/toast";
// import { useQuery } from "@tanstack/react-query";
// import {
//   User,
//   Role,
//   Product,
//   ProductVariant,
//   Category,
//   SubCategory,
//   SubSubCategory,
//   OrderItem,
//   Order,
//   Address,
//   Contact,
//   CustomerCare,
//   BusinessInfo,
//   ShippingInfo,
// } from "@prisma/client";
// import { SellerStoreProvider } from "@/Hooks/use-store-context";

// type FormState = {
//   email: string;
//   otp?: string;
// };

// interface SellerStoreData {
//   id: string;
//   name: string;
//   description: string | null;
//   logo: string | null;
//   banners: string[];
//   contactEmail: string;
//   country: string;
//   state: string;
//   contactPhone: string;
//   accountType: string;
//   contact: Contact;
//   customerCare: CustomerCare;
//   businessInfo: BusinessInfo | null;
//   shippingInfo: ShippingInfo;
//   userId: string;
//   user: User;
//   createdAt: Date;
//   updatedAt: Date;
//   products: (Product & {
//     variants: ProductVariant[];
//     category: Category;
//     subCategory: SubCategory | null;
//     subSubCategory: SubSubCategory | null;
//   })[];
//   orderItems: (OrderItem & {
//     order: Order & {
//       buyer: User;
//       address: Address;
//     };
//   })[];
// }

// // Function to fetch seller's store data
// const fetchSellerStore = async (): Promise<{ store: SellerStoreData }> => {
//   const res = await fetch("/api/store"); // Your API endpoint
//   if (!res.ok) {
//     const errorData = await res.json();
//     throw new Error(errorData.error || "Failed to fetch seller store data.");
//   }
//   return res.json();
// };

// const VerificationForm = () => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<FormState>();
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { toast } = useToast();
//   const [resendTimer, setResendTimer] = useState(60);
//   const [otpSent, setOtpSent] = useState(false);
//   const [redirect, setRedirect] = useState(false);
//   const [otp, setOtp] = useState("");

//   // Fetch seller's store data
//   const { data, isLoading } = useQuery<{ store: SellerStoreData }, Error>({
//     queryKey: ["sellerAuth"],
//     queryFn: fetchSellerStore,
//     staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
//     refetchOnWindowFocus: false,
//     retry: 1, // Retry once if it fails
//   });

//   const sellerStore = data?.store!;

//   const handleSendOtp = async () => {
//     if (!sellerStore?.contactEmail) {
//       toast({
//         title: "Error",
//         description: "No contact email found for the store.",
//         variant: "destructive",
//         action: <ToastAction altText="Okay">Dismiss</ToastAction>,
//       });
//       return;
//     }

//     await fetch("/api/store/resendOtp", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email: sellerStore.contactEmail }),
//     });
//     setLoading(false);
//     setOtpSent(true);
//     setResendTimer(60);
//     toast({
//       title: "OTP Sent",
//       description: "A new OTP has been sent to your email address.",
//       action: <ToastAction altText="Okay">Dismiss</ToastAction>,
//     });
//   };

//   useEffect(() => {
//     handleSendOtp();
//   }, []);

//   const renderLoadingSpinner = () => (
//     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//   );

//   const handleVerifyOtp = async (data: FormState) => {
//     setLoading(true);

//     const redirect_url = searchParams.get("redirectUrl") || "/";

//     try {
//       const res = await fetch("/api/store/verifyOtp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: data.email,
//           otp: data.otp,
//           redirect_url,
//         }),
//       });

//       const result = await res.json();

//       if (res.ok && result.success) {
//         setRedirect(true);
//         toast({
//           title: "Success!",
//           description:
//             result.message || "Authentication successful! Redirecting...",
//           action: <ToastAction altText="Go to Dashboard">Dismiss</ToastAction>,
//         });
//         router.push(result.redirect_url || "/");
//       } else {
//         toast({
//           title: "Verification Failed",
//           description:
//             result.error || "OTP verification failed. Please try again.",
//           variant: "destructive",
//           action: <ToastAction altText="Try again">Dismiss</ToastAction>,
//         });
//       }
//     } catch (error) {
//       console.error("OTP Verify Error:", error);
//       toast({
//         title: "Network Error",
//         description:
//           "Could not connect to the server during OTP verification. Please try again.",
//         variant: "destructive",
//         action: <ToastAction altText="Retry">Dismiss</ToastAction>,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOTPChange = (newValue: string) => {
//     // handle the OTP value directly
//     setOtp(newValue);
//   };

//   useEffect(() => {
//     let timer: string | number | NodeJS.Timeout | undefined;
//     if (otpSent && resendTimer > 0) {
//       timer = setInterval(() => {
//         setResendTimer((prev) => prev - 1);
//       }, 1000);
//     } else if (resendTimer === 0) {
//       clearInterval(timer);
//     }
//     return () => clearInterval(timer);
//   }, [otpSent, resendTimer]);

//   // Handle loading state for the main store data
//   if (isLoading) {
//     return (
//       <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
//         </div>
//       </section>
//     );
//   }

//   if (sellerStore.user.isSeller) {
//     router.push("/your/store/dashboard");
//     return null;
//   }

//   return (
//     <SellerStoreProvider store={sellerStore}>
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
//         <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-200">
//           <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-5">
//             <h3 className="text-2xl font-semibold text-center text-gray-800 mb-4">
//               Login
//             </h3>
//             <p className="text-sm text-center text-gray-600 mb-6">
//               A One-Time Password (OTP) has been sent to{" "}
//               <span className="font-medium text-gray-800">
//                 {sellerStore.contactEmail}
//               </span>
//               . Please enter it below.
//             </p>

//             <div className="flex flex-col justify-center items-center">
//               <Label
//                 htmlFor="otp"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Enter OTP
//               </Label>
//               <div className="relative flex items-center">
//                 <InputOTP
//                   id="otp"
//                   {...register("otp", {
//                     required: "OTP is required.",
//                     // pattern: {
//                     //   value: /^\d{6}$/,
//                     //   message: "OTP must be 6 digits.",
//                     // },
//                   })}
//                   pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
//                   maxLength={6}
//                   onChange={handleOTPChange}
//                   // onComplete={handleVerifyOtp}
//                 >
//                   <InputOTPGroup>
//                     <InputOTPSlot index={0} />
//                     <InputOTPSlot index={1} />
//                     <InputOTPSlot index={2} />
//                     <InputOTPSlot index={3} />
//                     <InputOTPSlot index={4} />
//                     <InputOTPSlot index={5} />
//                   </InputOTPGroup>
//                 </InputOTP>
//               </div>
//             </div>

//             <Button
//               type="submit"
//               disabled={loading}
//               className="w-full flex justify-center py-3 px-4 rounded-md shadow-md text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
//             >
//               {loading
//                 ? renderLoadingSpinner()
//                 : redirect
//                 ? "Redirecting..."
//                 : "Continue to Dashboard"}
//             </Button>

//             <div className="text-center text-sm mt-4">
//               {resendTimer > 0 ? (
//                 <p>
//                   Resend code in{" "}
//                   <span className="font-bold">{resendTimer}s</span>
//                 </p>
//               ) : (
//                 <Button
//                   type="button"
//                   variant="link"
//                   className="w-full text-gray-600 hover:text-gray-900 px-4 py-3 transition duration-200"
//                   onClick={handleSendOtp}
//                   disabled={resendTimer > 0 || loading}
//                 >
//                   Resend Code
//                 </Button>
//               )}
//             </div>
//           </form>
//         </div>
//       </div>
//     </SellerStoreProvider>
//   );
// };

// export default VerificationForm;

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
    if (formData.otp.length !== 6) {
      setError("otp", { type: "manual", message: "OTP must be 6 digits." });
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/store/verifyOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactEmail, // Use the fetched email
          otp: formData.otp,
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
        // Redirect upon successful verification
        router.push(redirect_url);
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
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
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
