// app/checkout/cancel/page.tsx
"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation"; // To get orderId
import { HoverPrefetchLink } from "@/lib/HoverLink";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId"); // The order ID passed from your backend

  // You might want to use this orderId to update the order status to 'CANCELLED'
  // in your database via an API call, if your webhook doesn't handle it
  // for all event types. However, the webhook usually handles `checkout.session.completed`
  // and your backend might update a different status for `cancel` events if needed.

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-red-50 p-8 text-center rounded-lg shadow-lg">
      <XCircle className="w-20 h-20 text-red-600 mb-6" />
      <h1 className="text-4xl font-extrabold text-red-800 mb-4">
        Payment Cancelled
      </h1>
      <p className="text-xl text-red-700 mb-8">
        Your payment was not completed. Please try again or contact support.
      </p>
      {orderId && (
        <p className="text-sm text-red-700 mb-4">Order ID: {orderId}</p>
      )}
      <HoverPrefetchLink href="/cart" passHref>
        <Button className="bg-red-700 hover:bg-red-800 text-white text-lg px-8 py-3 rounded-md shadow-lg transition-all duration-300 transform hover:scale-105">
          Return to Cart
        </Button>
      </HoverPrefetchLink>
      <HoverPrefetchLink
        href="/"
        passHref
        className="mt-4 text-red-600 hover:text-red-800"
      >
        <Button variant="link">Continue Shopping</Button>
      </HoverPrefetchLink>
    </div>
  );
}
