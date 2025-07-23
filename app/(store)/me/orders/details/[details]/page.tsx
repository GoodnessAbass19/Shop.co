// app/orders/[orderId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Address,
  User,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Home,
  Loader2,
} from "lucide-react"; // Added Home icon
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn/ui Card
import { Separator } from "@/components/ui/separator"; // Assuming shadcn/ui Separator
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeliveryTimeline } from "@/components/seller/DeliveryTimeline";
import { HoverPrefetchLink } from "@/lib/HoverLink";

// Extend types to match API response structure
type OrderItemWithProductDetails = OrderItem & {
  productVariant: ProductVariant & {
    product: Pick<Product, "id" | "name" | "images">;
  };
};

type OrderWithAllDetails = Order & {
  items: OrderItemWithProductDetails[];
  address: Address;
  buyer: User;
};

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error: any = new Error(
        data.error || "Failed to fetch order details."
      );
      error.status = res.status;
      throw error;
    }
    return data;
  });

const fetchOrderById = async (
  orderId: string
): Promise<OrderWithAllDetails> => {
  const res = await fetch(`/api/orders/${orderId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `Failed to fetch order: ${orderId}`);
  }
  const data = await res.json();
  return data.order; // Assuming API returns { order: ... }
};

const OrderDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.details as string;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<
    OrderWithAllDetails,
    Error
  >({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel order.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] }); // Invalidate current order
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Invalidate general order list
      toast.success("Order cancelled successfully!");
    },
    onError: (mutationError: Error) => {
      toast.error(`Error cancelling order: ${mutationError.message}`);
    },
  });

  const handleCancelClick = () => {
    if (order) {
      cancelOrderMutation.mutate(order.id);
    }
  };

  // Redirect if unauthorized
  if (error) {
    router.push(`/sign-in?redirect_url=/orders/${orderId}`);
    return null;
  }

  if (isLoading) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          {/* <p className="text-lg text-gray-700">Loading order details...</p> */}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[calc(100vh-200px)] flex items-center justify-center bg-red-50">
        <div className="p-8 border border-red-300 rounded-lg bg-red-100 text-red-800 text-center shadow-md">
          <p className="text-xl font-semibold mb-3">Error:</p>
          {/* <p className="mb-4">{error.}</p> */}
          <HoverPrefetchLink
            href="/orders"
            className="inline-flex items-center px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </HoverPrefetchLink>
        </div>
      </section>
    );
  }

  const order: OrderWithAllDetails | null = data ?? null;
  const isCancellable = order?.status === "PENDING" || order?.status === "PAID"; // Adjust based on your OrderStatus enum
  const hasRefundStatus =
    order?.refundStatus !== undefined && order?.refundStatus !== null;
  if (!order) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[calc(100vh-200px)] flex items-center justify-center bg-white">
        <div className="p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700 mb-2">
            Order Not Found
          </p>
          <p className="text-gray-500 mb-4">
            The order you are looking for does not exist or you do not have
            permission to view it.
          </p>
          <HoverPrefetchLink
            href="/orders"
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Orders
          </HoverPrefetchLink>
        </div>
      </section>
    );
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "PAID":
        return "text-blue-600 bg-blue-100";
      case "SHIPPED":
        return "text-purple-600 bg-purple-100";
      case "DELIVERED":
        return "text-green-600 bg-green-100";
      case "CANCELLED":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 mr-1" />;
      case "PAID":
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case "SHIPPED":
        return <Package className="w-4 h-4 mr-1" />;
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  if (!order) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[calc(100vh-200px)] flex items-center justify-center bg-white">
        <div className="p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700 mb-2">
            Order Not Found
          </p>
          <p className="text-gray-500 mb-4">
            The order you are looking for does not exist or you do not have
            permission to view it.
          </p>
          <HoverPrefetchLink
            href="/orders"
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Orders
          </HoverPrefetchLink>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-screen-2xl mx-auto mt-10 px-4 md:px-6 lg:px-8 pb-10">
      <div className="container mx-auto">
        <div className="flex items-center mb-6">
          <HoverPrefetchLink
            href="/me/orders"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-lg font-medium">Back to All Orders</span>
          </HoverPrefetchLink>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Details</h1>
        <p className="text-gray-600 mb-8">
          Detailed information for order #
          {order.id.substring(0, 8).toUpperCase()}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">
                Order Summary
              </CardTitle>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold uppercase flex items-center ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusIcon(order.status)}
                {order.status}
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-gray-700 space-y-2">
                <p>
                  <span className="font-semibold">Order ID:</span> {order.id}
                </p>
                <p>
                  <span className="font-semibold">Placed On:</span>{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {/* {order.deliveredAt && (
                  <p className="text-green-700">
                    <span className="font-semibold">Delivered On:</span>{" "}
                    {new Date(order.deliveredAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )} */}
                {order.cancelledAt && (
                  <p className="text-red-700">
                    <span className="font-semibold">Cancelled On:</span>{" "}
                    {new Date(order.cancelledAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              <Separator className="my-6" />
              <div className="space-y-3">
                <h3 className="text-xl font-semibold mb-3">Items Purchased</h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      className="border-b border-gray-200 last:border-0 space-y-2"
                      key={item.id}
                    >
                      <Badge
                        variant={
                          item.deliveryStatus === "PENDING"
                            ? "warning"
                            : item.deliveryStatus === "OUT_FOR_DELIVERY"
                            ? "info"
                            : item.deliveryStatus === "DELIVERED"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs px-2 py-1"
                      >
                        {item.deliveryStatus}
                      </Badge>
                      <div
                        // key={item.id}
                        className="flex items-start gap-4 p-3 border rounded-md bg-gray-50"
                      >
                        {item.productVariant.product.images?.[0] && (
                          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                            <Image
                              src={item.productVariant.product.images[0]}
                              alt={item.productVariant.product.name}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        )}
                        <div className="flex-grow">
                          <p className="font-semibold text-lg text-gray-900">
                            {item.productVariant.product.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity}{" "}
                            {item.productVariant.size &&
                              ` - Size: ${item.productVariant.size}`}
                            {item.productVariant.color &&
                              ` - Color: ${item.productVariant.color}`}
                          </p>
                          <p className="text-md font-medium text-gray-800 mt-1">
                            ${item.price.toFixed(2)} / item
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg text-gray-900">
                            ${(item.quantity * item.price).toFixed(2)}
                          </p>
                          <Dialog>
                            <DialogTrigger className="capitalize text-right border rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50">
                              View status history
                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Package History</DialogTitle>
                              </DialogHeader>
                              <DeliveryTimeline
                                deliveryStatus={item.deliveryStatus}
                              />
                              {/* <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently delete this file from our
                              servers?
                            </DialogDescription>
                          </DialogHeader> */}
                              {/* <DialogClose>Confirm</DialogClose> */}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address & Total Card */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700">
                  <p className="font-semibold">Recipient: {order.buyer.name}</p>
                  <p className="font-medium">{order.address.street}</p>
                  <p>
                    {order.address.city}, {order.address.state}{" "}
                    {order.address.postalCode}
                  </p>
                  <p>{order.address.country}</p>
                  {/* Add more address details if available, e.g., recipient name, phone */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Order Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Subtotal ({order.items.length} items):</span>
                    <span>
                      $
                      {order.items
                        .reduce(
                          (sum, item) => sum + item.quantity * item.price,
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  {/* You might add shipping cost, tax, discounts here if applicable */}
                  <div className="flex justify-between font-semibold text-lg text-gray-900 pt-2 border-t border-gray-200 mt-2">
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                  {/* Add payment status if relevant */}
                  {/* <p className="text-sm text-gray-500 mt-2">Payment Status: Paid</p> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div>
        {/* --- NEW: Display Refund Status --- */}
        {hasRefundStatus && (
          <p className="text-lg text-gray-700 mb-2">
            <strong>Refund Status:</strong>
            <span
              className={`font-semibold ml-2 ${
                order.refundStatus === "SUCCEEDED"
                  ? "text-green-600"
                  : order.refundStatus === "REQUIRED" ||
                    order.refundStatus === "PENDING"
                  ? "text-orange-600"
                  : order.refundStatus === "FAILED"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {order.refundStatus?.replace(/_/g, " ") || "N/A"}{" "}
              {/* Replace underscores for display */}
            </span>
          </p>
        )}
      </div>

      {isCancellable && (
        <Button
          onClick={handleCancelClick}
          disabled={cancelOrderMutation.isPending}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white"
        >
          {cancelOrderMutation.isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            "Cancel Order"
          )}
        </Button>
      )}
      {!isCancellable && order.status !== "CANCELLED" && (
        <p className="mt-4 text-gray-600">
          This order cannot be cancelled at its current status.
        </p>
      )}
      {order.status === "CANCELLED" && (
        <p className="mt-4 text-red-600 font-semibold">
          This order has been cancelled.
        </p>
      )}
    </section>
  );
};

export default OrderDetailsPage;
