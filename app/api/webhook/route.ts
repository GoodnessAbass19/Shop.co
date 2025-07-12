// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma"; // Your Prisma client instance
import { OrderStatus } from "@prisma/client"; // Import OrderStatus enum for clarity

// Initialize Stripe outside the handler for efficiency
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil", // Use your current Stripe API version (e.g., "2025-05-28.basil" as required)
});

// The endpoint secret for Stripe webhooks
// Ensure this is set in your .env.local file
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// This is crucial for Next.js App Router to allow raw body reading
// and ensure the route is always dynamic (server-side, not cached).
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 1. Get the raw body of the request for Stripe signature verification
  // Next.js App Router uses req.arrayBuffer() to get the raw body.
  const buf = await req.arrayBuffer();
  // Convert ArrayBuffer to Node.js Buffer, as Stripe's constructEvent expects a Buffer.
  const rawBody = Buffer.from(buf);

  // 2. Get the Stripe signature from the request headers
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    // 3. Construct the Stripe event
    // This verifies the signature against the raw body and webhook secret.
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    // 4. Handle signature verification failure
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 5. Handle the event based on its type
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout Session Completed Event Received:", session.id);

      const orderId = session.metadata?.orderId;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null; // Get PaymentIntent ID

      // Validate metadata
      if (!orderId) {
        console.error(
          "Missing orderId in Stripe session metadata for session:",
          session.id
        );
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }
      if (!paymentIntentId) {
        console.error(
          "Missing paymentIntentId in Stripe session for session:",
          session.id
        );
        // This is a critical error, as we need paymentIntentId for refunds
        return NextResponse.json(
          { error: "Missing paymentIntentId" },
          { status: 400 }
        );
      }

      try {
        // Update the order status to COMPLETED and save the paymentIntentId
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID, // Use the OrderStatus enum
            stripePaymentIntentId: paymentIntentId, // Save the PaymentIntent ID
            paidAt: new Date(), // Set the payment date
            refundStatus: "NOT_APPLICABLE", // Initialize refund status for a completed order
          },
          include: {
            items: {
              // Include order items to update product stock and sold count
              include: {
                productVariant: {
                  select: {
                    id: true,
                    stock: true,
                    productId: true,
                  },
                },
              },
            },
          },
        });
        console.log(
          `Order ${order.id} status updated to COMPLETED and PaymentIntentId saved.`
        );

        // --- Update product variant stock and product sold count ---
        for (const item of order.items) {
          await prisma.productVariant.update({
            where: { id: item.productVariant.id },
            data: {
              stock: { decrement: item.quantity },
            },
          });
          await prisma.product.update({
            where: { id: item.productVariant.productId },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
        }
        return NextResponse.json({ received: true }, { status: 200 });
      } catch (dbError) {
        console.error(
          "Database update failed after checkout session completed for order:",
          orderId,
          dbError
        );
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

    case "charge.refund.updated": // NEW CASE for Refund Updates
      const refund = event.data.object as Stripe.Refund;
      console.log("Charge Refund Updated Event Received:", refund.id);

      // Find the order using the payment_intent ID associated with the refund
      const relatedPaymentIntentId =
        typeof refund.payment_intent === "string"
          ? refund.payment_intent
          : null;

      if (!relatedPaymentIntentId) {
        console.error("Missing payment_intent ID in refund event:", refund.id);
        return NextResponse.json(
          { error: "Missing payment_intent ID" },
          { status: 400 }
        );
      }

      try {
        const orderToUpdate = await prisma.order.findFirst({
          where: { stripePaymentIntentId: relatedPaymentIntentId },
        });

        if (!orderToUpdate) {
          console.warn(
            `Order not found for PaymentIntent ID ${relatedPaymentIntentId}. Manual review needed.`
          );
          return NextResponse.json(
            { received: true, message: "Order not found for refund event." },
            { status: 200 }
          );
        }

        let newRefundStatus: string;
        // Stripe refund statuses are: pending, succeeded, failed, canceled
        // Map these to your custom `refundStatus` strings (e.g., from an enum)
        switch (refund.status) {
          case "succeeded":
            newRefundStatus = "SUCCEEDED";
            break;
          case "pending":
            newRefundStatus = "PENDING";
            break;
          case "failed":
            newRefundStatus = "FAILED";
            break;
          case "canceled": // A refund can be cancelled after creation if it's still pending
            newRefundStatus = "CANCELLED"; // Or 'REFUND_CANCELLED'
            break;
          default:
            newRefundStatus = "UNKNOWN"; // Handle unexpected statuses
        }

        // Update the order with the refund status and Stripe Refund ID
        await prisma.order.update({
          where: { id: orderToUpdate.id },
          data: {
            stripeRefundId: refund.id, // Store the Stripe Refund ID
            refundStatus: newRefundStatus, // Update your custom refund status
            refundRequestedAt: refund.created
              ? new Date(refund.created * 1000)
              : null, // Store the refund request date
          },
        });
        console.log(
          `Order ${orderToUpdate.id} refund status updated to ${newRefundStatus}. Stripe Refund ID: ${refund.id}`
        );

        return NextResponse.json({ received: true }, { status: 200 });
      } catch (dbError) {
        console.error(
          "Database update failed for refund event:",
          refund.id,
          dbError
        );
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

    // You might also want to listen for 'charge.refunded' if you just need to know
    // when a charge is fully refunded, rather than tracking lifecycle steps.
    // case 'charge.refunded':
    //   // This event typically means a full refund was processed successfully.
    //   // You might update refundStatus to 'SUCCEEDED' here if you're not tracking
    //   // granular 'charge.refund.updated' events.
    //   console.log('Charge Refunded Event Received:', event.data.object);
    //   return NextResponse.json({ received: true }, { status: 200 });

    default:
      console.warn(`Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}
