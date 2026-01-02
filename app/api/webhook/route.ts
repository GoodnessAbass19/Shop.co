// import { NextResponse } from "next/server";
// import Stripe from "stripe";
// import prisma from "@/lib/prisma"; // Your Prisma client instance
// import { OrderStatus, NotificationType, Role } from "@prisma/client"; // Import OrderStatus, NotificationType, UserRole
// import { createAndSendNotification } from "@/lib/create-notification"; // Import the notification utility

// // Initialize Stripe outside the handler for efficiency
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2025-05-28.basil", // Use your current Stripe API version (e.g., "2025-05-28.basil" as required)
// });

// // The endpoint secret for Stripe webhooks
// // Ensure this is set in your .env.local file
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// // This is crucial for Next.js App Router to allow raw body reading
// // and ensure the route is always dynamic (server-side, not cached).
// export const dynamic = "force-dynamic";

// export async function POST(req: Request) {
//   // 1. Get the raw body of the request for Stripe signature verification
//   const buf = await req.arrayBuffer();
//   const rawBody = Buffer.from(buf);

//   // 2. Get the Stripe signature from the request headers
//   const sig = req.headers.get("stripe-signature");

//   let event: Stripe.Event;

//   try {
//     // 3. Construct the Stripe event
//     event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
//   } catch (err: any) {
//     // 4. Handle signature verification failure
//     console.error("Webhook signature verification failed:", err.message);
//     return new Response(`Webhook Error: ${err.message}`, { status: 400 });
//   }

//   // 5. Handle the event based on its type
//   switch (event.type) {
//     case "checkout.session.completed":
//       const session = event.data.object as Stripe.Checkout.Session;
//       console.log("Checkout Session Completed Event Received:", session.id);

//       const orderId = session.metadata?.orderId;
//       const paymentIntentId =
//         typeof session.payment_intent === "string"
//           ? session.payment_intent
//           : null;

//       if (!orderId) {
//         console.error(
//           "Missing orderId in Stripe session metadata for session:",
//           session.id
//         );
//         return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
//       }
//       if (!paymentIntentId) {
//         console.error(
//           "Missing paymentIntentId in Stripe session for session:",
//           session.id
//         );
//         return NextResponse.json(
//           { error: "Missing paymentIntentId" },
//           { status: 400 }
//         );
//       }

//       try {
//         // Update the order status to PAID and save the paymentIntentId
//         const order = await prisma.order.update({
//           where: { id: orderId },
//           data: {
//             status: OrderStatus.PAID, // Use the OrderStatus enum
//             stripePaymentIntentId: paymentIntentId, // Save the PaymentIntent ID
//             paidAt: new Date(), // Set the payment date
//             refundStatus: "NOT_APPLICABLE", // Initialize refund status for a completed order
//           },
//           include: {
//             buyer: {
//               select: { id: true, name: true, email: true }, // Include buyer for notification
//             },
//             items: {
//               include: {
//                 productVariant: {
//                   select: {
//                     id: true,
//                     quantity: true, // Include current stock

//                     productId: true,
//                     product: {
//                       select: {
//                         storeId: true,
//                         name: true,
//                         slug: true,
//                         lowStockThreshold: true,
//                       }, // Include storeId, name, slug for seller notification
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         });
//         console.log(
//           `Order ${order.id} status updated to PAID and PaymentIntentId saved.`
//         );

//         // --- Update product variant stock and product sold count, and check for low stock ---
//         for (const item of order.items) {
//           // Deduct stock from product variant
//           const updatedVariant = await prisma.productVariant.update({
//             where: { id: item.productVariant.id },
//             data: {
//               quantity: { decrement: item.quantity },
//             },
//             select: {
//               quantity: true,

//               product: {
//                 select: {
//                   id: true,
//                   name: true,
//                   slug: true,
//                   storeId: true,
//                   lowStockThreshold: true,
//                 },
//               },
//             },
//           });

//           // Deduct stock from main product and increment sold count
//           await prisma.productVariant.update({
//             where: { id: item.productVariant.id },
//             data: {
//               quantity: { decrement: item.quantity },
//             },
//           });

//           await prisma.product.update({
//             where: { id: item.productVariant.productId },
//             data: {
//               soldCount: { increment: item.quantity },
//             },
//           });

//           // Check for low stock / out of stock and send notifications
//           const currentStock = updatedVariant.quantity;
//           const stockThreshold = updatedVariant.product.lowStockThreshold ?? 5; // Default to 5 if not set

//           if (currentStock <= stockThreshold && currentStock > 0) {
//             // Low stock notification
//             const sellerStore = await prisma.store.findUnique({
//               where: { id: updatedVariant.product.storeId },
//               select: { userId: true, name: true },
//             });
//             if (sellerStore && sellerStore.userId) {
//               try {
//                 await createAndSendNotification({
//                   userId: sellerStore.userId,
//                   userRole: Role.SELLER,
//                   type: NotificationType.LOW_STOCK_THRESHOLD,
//                   title: `Low Stock Alert: ${updatedVariant.product.name}`,
//                   message: `Product "${updatedVariant.product.name}" is now at ${currentStock} units. Threshold is ${stockThreshold}.`,
//                   link: `/dashboard/seller/products/${updatedVariant.product.slug}`,
//                   relatedEntityId: updatedVariant.product.id,
//                   relatedEntityType: "PRODUCT",
//                 });
//               } catch (notificationError) {
//                 console.error(
//                   `Failed to send low stock notification for ${updatedVariant.product.name}:`,
//                   notificationError
//                 );
//               }
//             }
//           } else if (currentStock === 0) {
//             // Out of stock notification
//             const sellerStore = await prisma.store.findUnique({
//               where: { id: updatedVariant.product.storeId },
//               select: { userId: true, name: true },
//             });
//             if (sellerStore && sellerStore.userId) {
//               try {
//                 await createAndSendNotification({
//                   userId: sellerStore.userId,
//                   userRole: Role.SELLER,
//                   type: NotificationType.OUT_OF_STOCK,
//                   title: `Out of Stock: ${updatedVariant.product.name}`,
//                   message: `Product "${updatedVariant.product.name}" is now out of stock.`,
//                   link: `/dashboard/seller/products/${updatedVariant.product.slug}`,
//                   relatedEntityId: updatedVariant.product.id,
//                   relatedEntityType: "PRODUCT",
//                 });
//               } catch (notificationError) {
//                 console.error(
//                   `Failed to send out of stock notification for ${updatedVariant.product.name}:`,
//                   notificationError
//                 );
//               }
//             }
//           }
//         }
//         // --- End Stock Update and Notification ---

//         // --- Notifications for Checkout Session Completed (Order Paid) ---
//         // Notify the buyer
//         try {
//           if (order.buyer?.id) {
//             await createAndSendNotification({
//               userId: order.buyer.id,
//               userRole: Role.BUYER,
//               type: NotificationType.ORDER_STATUS_UPDATE,
//               title: `Payment Confirmed for Order #${order.id.substring(
//                 0,
//                 8
//               )}...`,
//               message: `Your payment for order #${order.id.substring(
//                 0,
//                 8
//               )}... has been successfully processed.`,
//               link: `/buyer/orders/${order.id}`,
//               relatedEntityId: order.id,
//               relatedEntityType: "ORDER",
//             });
//           }
//         } catch (notificationError) {
//           console.error(
//             "Failed to send buyer notification for checkout.session.completed:",
//             notificationError
//           );
//         }

//         // Notify relevant sellers that their items in this order are paid
//         const uniqueSellerUserIds = new Set<string>();
//         for (const item of order.items) {
//           const storeId = item.productVariant.product.storeId;
//           const sellerStore = await prisma.store.findUnique({
//             where: { id: storeId },
//             select: { userId: true, name: true },
//           });
//           if (sellerStore && sellerStore.userId) {
//             uniqueSellerUserIds.add(sellerStore.userId);
//           }
//         }

//         for (const sellerUserId of Array.from(uniqueSellerUserIds)) {
//           try {
//             await createAndSendNotification({
//               userId: sellerUserId,
//               userRole: Role.SELLER,
//               type: NotificationType.NEW_ORDER, // Changed to NEW_ORDER
//               title: `New Paid Order! #${order.id.substring(0, 8)}...`,
//               message: `A new order containing your items has been paid. Order ID: ${order.id.substring(
//                 0,
//                 8
//               )}...`,
//               link: `/dashboard/seller/orders/${order.id}`,
//               relatedEntityId: order.id,
//               relatedEntityType: "ORDER",
//             });
//           } catch (notificationError) {
//             console.error(
//               `Failed to send seller notification for checkout.session.completed to ${sellerUserId}:`,
//               notificationError
//             );
//           }
//         }
//         // --- End Order Paid Notifications ---

//         return NextResponse.json({ received: true }, { status: 200 });
//       } catch (dbError) {
//         console.error(
//           "Database update failed after checkout session completed for order:",
//           orderId,
//           dbError
//         );
//         return NextResponse.json(
//           { error: "Database update failed" },
//           { status: 500 }
//         );
//       }

//     case "charge.refund.updated": // NEW CASE for Refund Updates
//       const refund = event.data.object as Stripe.Refund;
//       console.log("Charge Refund Updated Event Received:", refund.id);

//       const relatedPaymentIntentId =
//         typeof refund.payment_intent === "string"
//           ? refund.payment_intent
//           : null;

//       if (!relatedPaymentIntentId) {
//         console.error("Missing payment_intent ID in refund event:", refund.id);
//         return NextResponse.json(
//           { error: "Missing payment_intent ID" },
//           { status: 400 }
//         );
//       }

//       try {
//         const orderToUpdate = await prisma.order.findFirst({
//           where: { stripePaymentIntentId: relatedPaymentIntentId },
//           include: {
//             buyer: {
//               select: { id: true, name: true, email: true },
//             },
//             items: {
//               include: {
//                 productVariant: {
//                   select: {
//                     product: {
//                       select: { storeId: true },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         });

//         if (!orderToUpdate) {
//           console.warn(
//             `Order not found for PaymentIntent ID ${relatedPaymentIntentId}. Manual review needed.`
//           );
//           return NextResponse.json(
//             { received: true, message: "Order not found for refund event." },
//             { status: 200 }
//           );
//         }

//         let newRefundStatus: string;
//         switch (refund.status) {
//           case "succeeded":
//             newRefundStatus = "SUCCEEDED";
//             break;
//           case "pending":
//             newRefundStatus = "PENDING";
//             break;
//           case "failed":
//             newRefundStatus = "FAILED";
//             break;
//           case "canceled":
//             newRefundStatus = "CANCELLED";
//             break;
//           default:
//             newRefundStatus = "UNKNOWN";
//         }

//         await prisma.order.update({
//           where: { id: orderToUpdate.id },
//           data: {
//             stripeRefundId: refund.id,
//             refundStatus: newRefundStatus,
//             refundRequestedAt: refund.created
//               ? new Date(refund.created * 1000)
//               : null,
//           },
//         });
//         console.log(
//           `Order ${orderToUpdate.id} refund status updated to ${newRefundStatus}. Stripe Refund ID: ${refund.id}`
//         );

//         // --- Notifications for Charge Refund Updated ---
//         // Notify the buyer
//         try {
//           if (orderToUpdate.buyer?.id) {
//             await createAndSendNotification({
//               userId: orderToUpdate.buyer.id,
//               userRole: Role.BUYER,
//               type: NotificationType.REFUND_PROCESSED_BUYER_SIDE,
//               title: `Refund Status: Order #${orderToUpdate.id.substring(
//                 0,
//                 8
//               )}...`,
//               message: `Your refund for order #${orderToUpdate.id.substring(
//                 0,
//                 8
//               )}... is now ${newRefundStatus.toLowerCase()}.`,
//               link: `/buyer/orders/${orderToUpdate.id}`,
//               relatedEntityId: orderToUpdate.id,
//               relatedEntityType: "ORDER",
//             });
//           }
//         } catch (notificationError) {
//           console.error(
//             "Failed to send buyer notification for charge.refund.updated:",
//             notificationError
//           );
//         }

//         // Notify relevant sellers
//         const uniqueSellerUserIdsForRefund = new Set<string>();
//         for (const item of orderToUpdate.items) {
//           const storeId = item.productVariant.product.storeId;
//           const sellerStore = await prisma.store.findUnique({
//             where: { id: storeId },
//             select: { userId: true, name: true },
//           });
//           if (sellerStore && sellerStore.userId) {
//             uniqueSellerUserIdsForRefund.add(sellerStore.userId);
//           }
//         }

//         for (const sellerUserId of Array.from(uniqueSellerUserIdsForRefund)) {
//           try {
//             await createAndSendNotification({
//               userId: sellerUserId,
//               userRole: Role.SELLER,
//               type: NotificationType.RETURN_PROCESSED_SELLER_SIDE, // Or REFUND_PROCESSED_SELLER_SIDE
//               title: `Refund Update: Order #${orderToUpdate.id.substring(
//                 0,
//                 8
//               )}...`,
//               message: `A refund for order #${orderToUpdate.id.substring(
//                 0,
//                 8
//               )}... involving your items is now ${newRefundStatus.toLowerCase()}.`,
//               link: `/dashboard/seller/orders/${orderToUpdate.id}`,
//               relatedEntityId: orderToUpdate.id,
//               relatedEntityType: "ORDER",
//             });
//           } catch (notificationError) {
//             console.error(
//               `Failed to send seller notification for charge.refund.updated to ${sellerUserId}:`,
//               notificationError
//             );
//           }
//         }
//         // --- End Notifications ---

//         return NextResponse.json({ received: true }, { status: 200 });
//       } catch (dbError) {
//         console.error(
//           "Database update failed for refund event:",
//           refund.id,
//           dbError
//         );
//         return NextResponse.json(
//           { error: "Database update failed" },
//           { status: 500 }
//         );
//       }

//     default:
//       console.warn(`Unhandled event type: ${event.type}`);
//       return NextResponse.json({ received: true }, { status: 200 });
//   }
// }

import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { OrderStatus, NotificationType, Role } from "@prisma/client";
import { createAndSendNotification } from "@/lib/create-notification";

export const dynamic = "force-dynamic";

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    console.error("❌ Invalid Paystack signature");
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.event) {
      // ===============================
      // 💰 PAYMENT SUCCESS
      // ===============================
      case "charge.success": {
        const data = event.data;
        const orderId = data.metadata?.orderId;
        const reference = data.reference;

        if (!orderId) {
          console.error("Missing orderId in metadata");
          return NextResponse.json({ received: true });
        }

        // Idempotency check
        const existing = await prisma.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });

        if (existing?.status === OrderStatus.PAID) {
          return NextResponse.json({ received: true });
        }

        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
            paystackReference: reference,
            paidAt: new Date(),
            refundStatus: "NOT_APPLICABLE",
          },
          include: {
            buyer: {
              select: { id: true, name: true, email: true }, // Include buyer for notification
            },
            items: {
              include: {
                productVariant: {
                  select: {
                    id: true,
                    quantity: true, // Include current stock

                    productId: true,
                    product: {
                      select: {
                        storeId: true,
                        name: true,
                        slug: true,
                        lowStockThreshold: true,
                      }, // Include storeId, name, slug for seller notification
                    },
                  },
                },
              },
            },
          },
        });

        // ===============================
        // 📦 STOCK UPDATE
        // ===============================
        for (const item of order.items) {
          const updatedVariant = await prisma.productVariant.update({
            where: { id: item.productVariant.id },
            data: { quantity: { decrement: item.quantity } },
            select: {
              quantity: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  storeId: true,
                  lowStockThreshold: true,
                },
              },
            },
          });

          await prisma.product.update({
            where: { id: item.productVariant.productId },
            data: { soldCount: { increment: item.quantity } },
          });

          const threshold = updatedVariant.product.lowStockThreshold ?? 5;

          if (updatedVariant.quantity <= threshold) {
            const store = await prisma.store.findUnique({
              where: { id: updatedVariant.product.storeId },
              select: { userId: true },
            });

            if (store?.userId) {
              await createAndSendNotification({
                userId: store.userId,
                userRole: Role.SELLER,
                type:
                  updatedVariant.quantity === 0
                    ? NotificationType.OUT_OF_STOCK
                    : NotificationType.LOW_STOCK_THRESHOLD,
                title: updatedVariant.product.name,
                message:
                  updatedVariant.quantity === 0
                    ? "Product is out of stock."
                    : `Only ${updatedVariant.quantity} units remaining.`,
                link: `/dashboard/seller/products/${updatedVariant.product.slug}`,
              });
            }
          }
        }

        // ===============================
        // 🔔 NOTIFICATIONS
        // ===============================
        if (order.buyer?.id) {
          await createAndSendNotification({
            userId: order.buyer.id,
            userRole: Role.BUYER,
            type: NotificationType.ORDER_STATUS_UPDATE,
            title: "Payment confirmed",
            message: "Your payment was successful.",
            link: `/buyer/orders/${order.id}`,
          });
        }

        const sellerIds = new Set<string>();
        for (const item of order.items) {
          const store = await prisma.store.findUnique({
            where: { id: item.productVariant.product.storeId },
            select: { userId: true },
          });
          if (store?.userId) sellerIds.add(store.userId);
        }

        for (const sellerId of sellerIds) {
          await createAndSendNotification({
            userId: sellerId,
            userRole: Role.SELLER,
            type: NotificationType.NEW_ORDER,
            title: "New paid order",
            message: `Order ${order.id.slice(0, 8)} has been paid.`,
            link: `/dashboard/seller/orders/${order.id}`,
          });
        }

        break;
      }

      // ===============================
      // 🔄 REFUND EVENTS
      // ===============================
      case "refund.processed":
      case "refund.failed": {
        const data = event.data;
        const reference = data.transaction?.reference;

        const order = await prisma.order.findFirst({
          where: { paystackReference: reference },
          include: { buyer: true },
        });

        if (!order) return NextResponse.json({ received: true });

        const refundStatus =
          event.event === "refund.processed" ? "SUCCEEDED" : "FAILED";

        await prisma.order.update({
          where: { id: order.id },
          data: {
            refundStatus,
            refundRequestedAt: new Date(),
          },
        });

        if (order.buyer?.id) {
          await createAndSendNotification({
            userId: order.buyer.id,
            userRole: Role.BUYER,
            type: NotificationType.REFUND_PROCESSED_BUYER_SIDE,
            title: "Refund update",
            message: `Refund ${refundStatus.toLowerCase()}.`,
            link: `/buyer/orders/${order.id}`,
          });
        }

        break;
      }

      default:
        console.warn("Unhandled Paystack event:", event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
