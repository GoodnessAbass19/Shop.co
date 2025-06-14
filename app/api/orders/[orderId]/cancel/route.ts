// app/api/orders/[orderId]/cancel/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Your custom auth function
import { OrderStatus } from "@prisma/client"; // Import OrderStatus enum
import Stripe from "stripe"; // Import Stripe library

// Initialize Stripe outside the handler
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil", // Ensure this matches the version in other Stripe routes
});

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    // 1. Find the order, include its items, product variants, and the Stripe PaymentIntent ID
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
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

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // 2. Security Check: Ensure the order belongs to the current user
    if (order.buyerId !== user.id) {
      return NextResponse.json(
        {
          error: "Forbidden: You do not have permission to cancel this order.",
        },
        { status: 403 }
      );
    }

    // 3. Check if the order is in a cancellable state
    // Orders can typically be cancelled if PENDING or INITIATED, and (potentially) COMPLETED if a refund is issued.
    // They usually cannot be cancelled if SHIPPED, or DELIVERED.
    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED // Already cancelled
    ) {
      return NextResponse.json(
        {
          error: `Order cannot be cancelled. Current status: ${order.status}.`,
        },
        { status: 400 }
      );
    }

    let refundAttempted = false;
    let refundSuccess = false;
    let refundId: string | null = null;
    let refundError: string | null = null;

    // 4. If the order was COMPLETED (paid), attempt a Stripe refund
    if (order.status === OrderStatus.PAID && order.stripePaymentIntentId) {
      refundAttempted = true;
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          amount: Math.round(order.total * 100), // Refund the full order total in cents
          reason: "requested_by_customer", // Optional: specify the reason for the refund
        });
        refundSuccess = true;
        refundId = refund.id;
        console.log(
          `Stripe refund initiated for PaymentIntent ${order.stripePaymentIntentId}. Refund ID: ${refund.id}`
        );
      } catch (refundErr: any) {
        refundError = refundErr.message;
        console.error(
          `Stripe refund failed for PaymentIntent ${order.stripePaymentIntentId}:`,
          refundErr.message
        );
        // You might decide to return an error here and not cancel the order in your DB,
        // or proceed with cancellation but mark it as needing manual refund.
        // For simplicity, we'll proceed with cancelling the order but include refund status in response.
      }
    } else if (
      order.status === OrderStatus.PAID &&
      !order.stripePaymentIntentId
    ) {
      console.warn(
        `Order ${order.id} was COMPLETED but is missing stripePaymentIntentId. Manual refund required.`
      );
      refundError =
        "Order was paid but missing Stripe Payment Intent ID. Manual refund needed.";
    }

    // 5. Update the order status to CANCELLED in your database
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(), // Set cancellation timestamp
        // Optionally, add fields to track refund status if `REFUNDED` is not a separate enum status
        // stripeRefundId: refundId,
        // refundAttemptStatus: refundAttempted ? (refundSuccess ? 'SUCCESS' : 'FAILED') : 'N/A',
      },
      include: {
        items: {
          include: {
            productVariant: true, // Re-include to get quantities for stock reversal
          },
        },
      },
    });
    console.log(`Order ${cancelledOrder.id} status updated to CANCELLED.`);

    // 6. Reverse stock for each item in the cancelled order
    for (const item of cancelledOrder.items) {
      // Increment product variant stock
      await prisma.productVariant.update({
        where: { id: item.productVariant.id },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      // Decrement the main Product's soldCount and increment its overall stock.
      await prisma.product.update({
        where: { id: item.productVariant.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
          soldCount: {
            decrement: item.quantity,
          },
        },
      });
    }
    console.log(
      `Stock and soldCount reversed for items in order ${cancelledOrder.id}.`
    );

    // Return success response, including refund status for frontend feedback
    return NextResponse.json(
      {
        success: true,
        message: "Order cancelled successfully.",
        order: cancelledOrder,
        refundStatus: refundAttempted
          ? refundSuccess
            ? "Refund successful"
            : `Refund failed: ${refundError}`
          : "No refund necessary (order not completed)",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order due to an internal error." },
      { status: 500 }
    );
  }
}
