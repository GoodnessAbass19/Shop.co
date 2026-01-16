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
