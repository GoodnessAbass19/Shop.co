// app/checkout/success/page.tsx
"use client"; // If you use useRouter or other client-side hooks

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation"; // To get session_id
import { HoverPrefetchLink } from "@/lib/HoverLink";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("trxref");

  useEffect(() => {
    if (sessionId) {
      // You might want to make an API call here to your backend
      // to confirm the session status with Stripe directly if needed
      // (though the webhook is the primary source of truth).
      // console.log("Stripe Session ID on success:", sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-green-50 p-8 text-center rounded-lg shadow-lg">
      <CheckCircle className="w-20 h-20 text-green-600 mb-6" />
      <h1 className="text-4xl font-extrabold text-green-800 mb-4">
        Payment Successful!
      </h1>
      <p className="text-xl text-green-700 mb-8">
        Thank you for your purchase. Your order is being processed.
      </p>
      <HoverPrefetchLink href="/me/orders" passHref>
        <Button className="bg-green-700 hover:bg-green-800 text-white text-lg px-8 py-3 rounded-md shadow-lg transition-all duration-300 transform hover:scale-105">
          View My Orders
        </Button>
      </HoverPrefetchLink>
      <HoverPrefetchLink
        href="/"
        passHref
        className="mt-4 text-green-600 hover:text-green-800"
      >
        <Button variant="link">Continue Shopping</Button>
      </HoverPrefetchLink>
    </div>
  );
}
