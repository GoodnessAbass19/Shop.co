// app/api/checkout/create-session/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import Stripe from "stripe";
// import prisma from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth";
// import { OrderStatus, NotificationType, Role } from "@prisma/client"; // Import NotificationType, UserRole
// import { createAndSendNotification } from "@/lib/create-notification"; // Import the notification utility

// // Initialize Stripe outside the handler for efficiency
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2025-05-28.basil", // Use your current Stripe API version (e.g., "2023-10-16" is a common stable one)
// });

// // Define your base URL for success/cancel redirects (e.g., http://localhost:3000 or your Vercel URL)
// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Fallback for local dev

// export async function POST(req: NextRequest, request: Request) {
//   try {
//     const user = await getCurrentUser();
//     const { addressId } = await req.json();
//     if (!addressId) {
//       return NextResponse.json(
//         { error: "Delivery address is required" },
//         { status: 400 }
//       );
//     }

//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // 1. Fetch the user's cart with all necessary details, including product discounts
//     const cart = await prisma.cart.findUnique({
//       where: { userId: user.id },
//       include: {
//         cartItems: {
//           include: {
//             productVariant: {
//               include: {
//                 product: {
//                   select: {
//                     name: true,
//                     images: true,
//                     id: true,
//                     storeId: true,
//                     // IMPORTANT: Include product discounts here to calculate them on the server
//                     discounts: {
//                       where: {
//                         expiresAt: {
//                           gte: new Date(), // Only active discounts
//                         },
//                         startsAt: {
//                           lte: new Date(), // Only discounts that have started
//                         },
//                       },
//                       orderBy: {
//                         percentage: "desc", // Get the best discount first
//                       },
//                       take: 1, // Optionally, only take the best discount per product
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!cart || cart.cartItems.length === 0) {
//       return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
//     }

//     let totalOrderAmount = 0;
//     const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
//     const orderItemsData: any[] = []; // To store data for creating OrderItems
//     const involvedStoreIds = new Set<string>(); // To track unique store IDs for notifications

//     for (const cartItem of cart.cartItems) {
//       const variant = cartItem.productVariant;
//       const product = variant.product;

//       // Ensure variant and stock are valid
//       if (!variant || variant.quantity < cartItem.quantity) {
//         return NextResponse.json(
//           {
//             error: `Insufficient stock for ${product.name} (${
//               variant.size || ""
//             }  Available: ${variant.quantity}`,
//           },
//           { status: 400 }
//         );
//       }

//       // --- Calculate the actual unit price after discount ---
//       let unitPrice = variant.price as any;

//       const bestDiscount = product.discounts?.[0]; // Access the first (best) discount

//       if (bestDiscount && bestDiscount.percentage! > 0) {
//         unitPrice = unitPrice * (1 - bestDiscount.percentage! / 100);
//       }

//       // Ensure unitPrice is not negative and rounded correctly for currency
//       unitPrice = parseFloat(unitPrice.toFixed(2));

//       // Add to Stripe line items (Stripe expects amount in cents)
//       lineItems.push({
//         price_data: {
//           currency: "ngn", // Your currency (should match your Stripe account's default)
//           product_data: {
//             name: product.name,
//             images: product.images.length > 0 ? product.images : undefined, // Optional images
//           },
//           unit_amount: Math.round(unitPrice * 100), // Convert to cents for Stripe
//         },
//         quantity: cartItem.quantity,
//       });

//       // Prepare data for OrderItem creation
//       orderItemsData.push({
//         quantity: cartItem.quantity,
//         price: unitPrice, // Store the final unit price (after discount) at time of order
//         productVariantId: variant.id,
//         storeId: product.storeId, // Assuming Product has storeId
//       });

//       totalOrderAmount += unitPrice * cartItem.quantity;

//       // Add storeId to the set for later notification
//       involvedStoreIds.add(product.storeId);
//     }

//     // 3. Create a PENDING order in your database
//     const userAddress = await prisma.address.findFirst({
//       where: { id: addressId }, // Assuming a default address
//     });

//     if (!userAddress) {
//       return NextResponse.json(
//         {
//           error:
//             "No default address found for the user. Please add an address before checkout.",
//         },
//         { status: 400 }
//       );
//     }

//     const newOrder = await prisma.order.create({
//       data: {
//         buyerId: user.id,
//         addressId: userAddress.id,
//         total: parseFloat(totalOrderAmount.toFixed(2)), // Store total with 2 decimal places
//         status: OrderStatus.PENDING, // Set initial status
//         items: {
//           create: orderItemsData, // Create all order items in one go
//         },
//       },
//     });
//     console.log(`Created PENDING order: ${newOrder.id}`);

//     // --- Notifications ---
//     // Notify the buyer about their new order
//     await createAndSendNotification({
//       userId: user.id,
//       userRole: Role.BUYER,
//       type: NotificationType.ORDER_CONFIRMATION,
//       title: `Order #${newOrder.id.substring(0, 8)}... Confirmed!`,
//       message: `Thank you for your purchase! Your order is now pending payment.`,
//       link: `/buyer/orders/${newOrder.id}`, // Link to buyer's order details page
//       // relatedEntityId: newOrder.id,
//       // relatedEntityType: "ORDER",
//     });

//     // Notify each involved seller about the new order
//     for (const storeId of involvedStoreIds) {
//       const sellerStore = await prisma.store.findUnique({
//         where: { id: storeId },
//         select: { userId: true, name: true },
//       });

//       if (sellerStore && sellerStore.userId) {
//         await createAndSendNotification({
//           userId: sellerStore.userId,
//           userRole: Role.SELLER,
//           type: NotificationType.NEW_ORDER,
//           title: `New Order! #${newOrder.id.substring(0, 8)}...`,
//           message: `You have a new order from ${
//             user.name || user.email || "a customer"
//           } containing items from your store (${sellerStore.name}).`,
//           link: `/dashboard/seller/orders/${newOrder.id}`, // Link to seller's order details page
//           // relatedEntityId: newOrder.id,
//           // relatedEntityType: "ORDER",
//         });
//       }
//     }
//     // --- End Notifications ---

//     // 4. Create the Stripe Checkout Session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card", "cashapp", "paypal", "amazon_pay"], // Add other payment methods as needed
//       line_items: lineItems,
//       mode: "payment",
//       success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${BASE_URL}/checkout/cancel?orderId=${newOrder.id}`, // Pass orderId to cancel page
//       metadata: {
//         orderId: newOrder.id, // Pass your internal order ID to the webhook
//         userId: user.id, // Optionally pass userId
//       },
//       customer_email: user.email, // Prefill customer email
//       // You might also want to include customer_details if available from your user session/profile
//       // customer_details: { email: user.email, name: user.name }, // If you have user name
//     });

//     // 5. Clear the user's cart after session creation
//     // This is optional, but often done after checkout initiation
//     // If you prefer to clear it only after successful payment (via webhook), remove this block.
//     await prisma.cartItem.deleteMany({
//       where: { cartId: cart.id },
//     });
//     await prisma.cart.delete({
//       where: { id: cart.id },
//     });

//     console.log(
//       `Cart for user ${user.id} cleared after checkout session created.`
//     );

//     return NextResponse.json(
//       { sessionId: session.id, url: session.url },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("API Error creating checkout session:", error);
//     // Be careful not to expose sensitive error details to the client in production
//     return NextResponse.json(
//       { error: "Failed to create checkout session." },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus, NotificationType, Role } from "@prisma/client";
import { createAndSendNotification } from "@/lib/create-notification";
import axios from "axios";
import { isSaleActive } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { addressId } = await req.json();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!addressId) {
      return NextResponse.json(
        { error: "Delivery address is required" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        cartItems: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    storeId: true,
                    discounts: {
                      where: {
                        expiresAt: { gte: new Date() },
                        startsAt: { lte: new Date() },
                      },
                      orderBy: { percentage: "desc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    let totalAmount = 0;
    const orderItemsData: any[] = [];
    const involvedStoreIds = new Set<string>();

    // 2️⃣ Price calculation
    for (const cartItem of cart.cartItems) {
      const variant = cartItem.productVariant;
      const product = variant.product;

      if (variant.quantity < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}`,
          },
          { status: 400 }
        );
      }

      let unitPrice = Number(variant.price);

      if (isSaleActive(variant.saleStartDate, variant.saleEndDate)) {
        unitPrice = variant.salePrice;
      }

      unitPrice = Number(unitPrice.toFixed(2));

      totalAmount += unitPrice * cartItem.quantity;

      orderItemsData.push({
        quantity: cartItem.quantity,
        price: unitPrice,
        productVariantId: variant.id,
        storeId: product.storeId,
      });

      involvedStoreIds.add(product.storeId);
    }

    // 3️⃣ Validate address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Delivery address not found" },
        { status: 400 }
      );
    }

    // 4️⃣ Create PENDING order
    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        addressId: address.id,
        total: Number(totalAmount.toFixed(2)),
        status: OrderStatus.PENDING,
        items: { create: orderItemsData },
      },
    });

    // 5️⃣ Notifications (UNCHANGED)
    await createAndSendNotification({
      userId: user.id,
      userRole: Role.BUYER,
      type: NotificationType.ORDER_CONFIRMATION,
      title: `Order #${order.id.slice(0, 8)} confirmed`,
      message: "Your order is pending payment.",
      link: `/buyer/orders/${order.id}`,
    });

    for (const storeId of involvedStoreIds) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { userId: true, name: true },
      });

      if (store?.userId) {
        await createAndSendNotification({
          userId: store.userId,
          userRole: Role.SELLER,
          type: NotificationType.NEW_ORDER,
          title: `New order received`,
          message: `Order ${order.id.slice(
            0,
            8
          )} contains items from your store (${store.name}).`,
          link: `/dashboard/seller/orders/${order.id}`,
        });
      }
    }

    // 6️⃣ Initialize Paystack transaction
    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: Math.round(totalAmount * 100), // kobo
        reference: `order_${order.id}`,
        callback_url: `${BASE_URL}/checkout/success`,
        metadata: {
          orderId: order.id,
          userId: user.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 7️⃣ Clear cart (same behavior as Stripe version)
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });

    return NextResponse.json(
      {
        authorizationUrl: paystackRes.data.data.authorization_url,
        reference: paystackRes.data.data.reference,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Paystack checkout error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
