"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";
import {
  Order,
  OrderItem,
  User as PrismaUser,
  Address,
  Product,
  ProductVariant,
  OrderStatus,
} from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ConfirmDeliveryForm } from "./ConfirmOrderForm";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { useSellerStore } from "@/Hooks/use-store-context";
import { useOrderRealtime } from "@/Hooks/use-real-time-update";
import { formatCurrencyValue } from "../../utils/format-currency-value";

// Define the full order structure including all relations
type FullOrder = Order & {
  buyer: Pick<PrismaUser, "id" | "name" | "email" | "phone"> | null;
  address: Address | null;
  items: (OrderItem & {
    productVariant: ProductVariant & {
      product: Pick<Product, "id" | "name" | "images" | "slug">;
    };
  })[];
};

// Function to fetch a single order by ID
const fetchOrderById = async (orderId: string): Promise<FullOrder> => {
  const res = await fetch(`/api/store/orders/${orderId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `Failed to fetch order ${orderId}.`);
  }
  const data = await res.json();
  return data.order;
};

// API request function
const sendReadyForPickupRequest = async ({
  itemId,
  sellerLat,
  sellerLng,
}: {
  itemId: string;
  sellerLat: number;
  sellerLng: number;
}) => {
  const res = await fetch(`/api/store/order/${itemId}/ready`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sellerLat, sellerLng }),
  });

  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: "Unknown error" };
    }
    throw new Error(
      (errorData as { error?: string }).error ||
        "Failed to mark item as ready for pickup."
    );
  }

  return res.json();
};

export default function OrderDetailsPage({ params }: { params: string }) {
  const orderId = params;
  const { store } = useSellerStore();
  const queryClient = useQueryClient();
  const [sellerLocation, setSellerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery<FullOrder, Error>({
    queryKey: ["sellerOrderDetails", orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
    staleTime: 20 * 1000,
    refetchOnWindowFocus: false,
  });

  const { mutate: markAsReady, isPending: isMarkingReady } = useMutation({
    mutationFn: sendReadyForPickupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sellerOrderDetails", orderId],
      });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const getSellerLocation = (itemId: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSellerLocation({ lat: latitude, lng: longitude });
          markAsReady({
            itemId,
            sellerLat: latitude!,
            sellerLng: longitude!,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Please enable location services to mark this order as ready.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // 🔹 Subscribe to seller channel for real-time updates
  // useEffect(() => {
  //   if (!store?.id) return;

  //   const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  //     cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  //     authEndpoint: "/api/pusher/auth",
  //   });

  //   const channelName = `private-seller-${store.id}`;
  //   const channel = pusher.subscribe(channelName);

  //   channel.bind("order-updated", (data: { orderId: string; status: string }) => {
  //     if (data.orderId === orderId) {
  //       queryClient.invalidateQueries({
  //         queryKey: ["sellerOrderDetails", orderId],
  //       });
  //     }
  //   });

  //   channel.bind(
  //     "order-item-updated",
  //     (data: { orderId: string; itemId: string; deliveryStatus: string }) => {
  //       if (data.orderId === orderId) {
  //         queryClient.invalidateQueries({
  //           queryKey: ["sellerOrderDetails", orderId],
  //         });
  //       }
  //     }
  //   );

  //   return () => {
  //     pusher.unsubscribe(channelName);
  //     pusher.disconnect();
  //   };
  // }, [store?.id, orderId, queryClient]);

  useOrderRealtime({
    orderId: orderId,
    type: "seller",
    entityId: store?.id ?? "",
  });

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
        return "success";
      case OrderStatus.PENDING:
        return "warning";
      case OrderStatus.SHIPPED:
        return "info";
      case OrderStatus.DELIVERED:
        return "default";
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusDisplayName = (status: OrderStatus) =>
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  // 🔹 Loading, error & empty states
  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading order details: {error?.message}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-gray-600 text-center py-8">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-semibold">Order not found.</p>
        <HoverPrefetchLink href="/your/store/dashboard/orders">
          <Button variant="outline" className="mt-4">
            Back to Orders
          </Button>
        </HoverPrefetchLink>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">
          Order #{order.id.substring(0, 8)}...
        </h2>
        <HoverPrefetchLink href="/your/store/dashboard/orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
        </HoverPrefetchLink>
      </div>

      {/* Order Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={getStatusBadgeVariant(order.status)}
              className="text-lg px-3 py-1"
            >
              {getStatusDisplayName(order.status)}
            </Badge>
            {order.createdAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {order.status === "DELIVERED" && (
                  <span className="text-green-600">
                    Delivered on:{" "}
                    {format(new Date(order.deliveredAt!), "MMM dd, yyyy HH:mm")}
                  </span>
                )}
                {order.status === "CANCELLED" && (
                  <span className="text-red-600">
                    Cancelled on:{" "}
                    {format(new Date(order.cancelledAt!), "MMM dd, yyyy HH:mm")}
                  </span>
                )}
                {order.status === "PAID" && order.paidAt && (
                  <span className="text-blue-600">
                    Paid on:{" "}
                    {format(new Date(order.paidAt), "MMM dd, yyyy HH:mm")}
                  </span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyValue(order.total)}
            </div>
            <p className="text-xs text-muted-foreground">Including all items</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(order.createdAt), "MMM dd, yyyy")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.createdAt), "HH:mm")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Package className="h-5 w-5 mr-2" /> Ordered Items (
            {order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Status</TableHead>
                {order.status === OrderStatus.PAID && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.productVariant.product.images &&
                    item.productVariant.product.images.length > 0 ? (
                      <Image
                        src={item.productVariant.product.images[0]}
                        alt={item.productVariant.product.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/60x60/e0e0e0/555555?text=No+Img";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                        No Img
                      </div>
                    )}
                  </TableCell>
                  <TableCell colSpan={1}>
                    <div className="font-medium text-sm hover:underline line-clamp-1">
                      {item.productVariant.product.name.length > 50
                        ? item.productVariant.product.name.substring(0, 50) +
                          "..."
                        : item.productVariant.product.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.productVariant.size &&
                      `Size: ${item.productVariant.size}`}
                    {item.productVariant.color &&
                      ` Color: ${item.productVariant.color}`}
                    {!item.productVariant.size &&
                      !item.productVariant.color &&
                      "N/A"}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyValue(item.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyValue(item.price * item.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                  {item.deliveryStatus !== "DELIVERED" && (
                    <TableCell className="text-right">
                      {["PENDING", "READY_FOR_PICKUP"].includes(
                        item.deliveryStatus
                      ) ? (
                        <button
                          onClick={() => getSellerLocation(item.id)}
                          disabled={
                            isMarkingReady ||
                            item.deliveryStatus === "READY_FOR_PICKUP"
                          }
                          className="border rounded-md px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          {isMarkingReady ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Assign to Rider"
                          )}
                        </button>
                      ) : null}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Buttons (e.g., Update Status, Process Refund) */}
      <div className="flex justify-end space-x-4 mt-8">
        {/* {order.status === OrderStatus.PAID && (
          <Button variant="secondary">Mark as Shipped</Button>
        )}
        {order.status === OrderStatus.SHIPPED && (
          <Button variant="secondary">Mark as Delivered</Button>
        )}
        {order.status === OrderStatus.PAID && order.stripePaymentIntentId && (
          <Button variant="destructive">Initiate Refund</Button>
        )} */}
        {/* More actions based on order status */}
      </div>
    </div>
  );
}

{
  /* Customer & Shipping Details */
}
{
  /* <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Customer Details
            </CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {order.buyer?.name || "Guest User"}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {order.buyer?.email || "N/A"}
            </p>
            <p>
              <span className="font-medium">Phone:</span>{" "}
              {order.buyer?.phone || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Shipping Address
            </CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2 text-gray-700">
            <p>{order.address?.street}</p>
            <p>
              {order.address?.city}, {order.address?.state}
            </p>
            <p>
              {order.address?.postalCode}, {order.address?.country}
            </p>
          </CardContent>
        </Card>
      </div> */
}
