import { DeliveryCodeEmail, sendEmail } from "@/lib/otp"; // Keep if DeliveryCodeEmail template is needed, but direct sendEmail will be replaced
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createAndSendNotification } from "@/lib/create-notification"; // Import notification utility
import { NotificationType, Role, OrderStatus } from "@prisma/client"; // Import necessary enums

export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  function generateOTP(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, "0");
  }

  try {
    const { itemId } = params; // Correctly destructure params
    const body = await req.json();
    const confirmationCode = generateOTP();

    // Ensure necessary data is present in the body
    const { riderName, riderPhone, trackingUrl } = body;
    if (!riderName || !riderPhone) {
      return NextResponse.json(
        { error: "Rider name and phone are required." },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        // Note: riderName and riderPhone are NOT stored if your schema doesn't have them
        // If your schema *does* have them, they will be updated.
        // Based on previous discussions, we decided NOT to store them.
        // So, these lines might not actually update DB fields unless you re-added them.
        // For this code, we'll assume they are temporary for notification.
        // riderName: riderName,
        // riderPhone: riderPhone,
        trackingUrl: trackingUrl || null,
        deliveryStatus: "OUT_FOR_DELIVERY", // Assuming OrderItem has a deliveryStatus field
        assignedAt: new Date(),
        deliveryCode: confirmationCode, // Store the generated code on the order item
      },
      include: {
        order: {
          include: {
            buyer: true, // Include buyer to get email/phone for notifications
          },
        },
        productVariant: {
          include: {
            product: true, // Include product to get name for notification message
          },
        },
      },
    });

    // Check if all items in the order are now 'OUT_FOR_DELIVERY' or 'DELIVERED'
    // This logic determines if the parent order status should be updated to SHIPPED
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: updatedItem.orderId,
      },
      select: {
        deliveryStatus: true,
      },
    });

    const allItemsOutForDeliveryOrDelivered = orderItems.every(
      (item) =>
        item.deliveryStatus === "OUT_FOR_DELIVERY" ||
        item.deliveryStatus === "DELIVERED"
    );

    // If all items are out for delivery or delivered, update the main order status to SHIPPED
    if (allItemsOutForDeliveryOrDelivered) {
      await prisma.order.update({
        where: { id: updatedItem.orderId },
        data: {
          status: OrderStatus.SHIPPED, // Use OrderStatus enum
          shippedAt: new Date(),
        },
      });
      console.log(`Order ${updatedItem.orderId} status updated to SHIPPED.`);
    }

    const buyerEmail = updatedItem.order.buyer?.email;
    const buyerId = updatedItem.order.buyer?.id;
    const buyerName = updatedItem.order.buyer?.name || "Customer";
    const productName = updatedItem.productVariant.product.name;
    const orderIdShort = updatedItem.order.id.substring(0, 8);

    // --- Create and Send Notification to Buyer ---
    if (buyerId && buyerEmail) {
      const notificationTitle = `Your Item is on the Way! (#${orderIdShort}...)`;
      const notificationMessage = `Your item "${productName}" from order #${orderIdShort}... is now out for delivery!
        Rider: ${riderName} (${riderPhone})
        Confirmation Code: ${confirmationCode}
        ${trackingUrl ? `Track here: ${trackingUrl}` : ""}
        Please provide this code to the rider upon delivery.`;

      const notificationLink = `/buyer/orders/${updatedItem.orderId}`; // Link to buyer's order details

      await createAndSendNotification({
        userId: buyerId,
        userRole: Role.BUYER,
        type: NotificationType.SHIPPING_UPDATE, // Or DELIVERY_CONFIRMATION
        title: notificationTitle,
        message: notificationMessage,
        link: notificationLink,
        // relatedEntityId: updatedItem.orderId,
        // relatedEntityType: "ORDER",
      });
      console.log(`Buyer notification sent for order item ${itemId}.`);
    } else {
      console.warn(
        `Could not send buyer notification for order item ${itemId}: Buyer ID or email missing.`
      );
    }

    await sendEmail({
      to: buyerEmail,
      subject: "Your Order is on the Way!",
      html: DeliveryCodeEmail({ name: buyerName, code: confirmationCode }),
    });
    // --- End Notification ---

    // The original sendEmail is now replaced by createAndSendNotification
    // await sendEmail({
    //   to: buyerEmail,
    //   subject: "Your Order is on the Way!",
    //   html: DeliveryCodeEmail({ name: buyerName, code: confirmationCode }),
    // });

    return NextResponse.json({ success: true, updatedItem }, { status: 200 });
  } catch (error) {
    console.error("API Error assigning rider to order item:", error);
    return NextResponse.json(
      { error: "Failed to assign rider and update order item." },
      { status: 500 }
    );
  }
}
