// components/seller/OrderManagement.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ListOrdered, Eye } from "lucide-react";
import type {
  OrderItem,
  Order,
  User,
  ProductVariant,
  Product,
} from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

export type StoreOrderItem = OrderItem & {
  order: Order & {
    buyer: Pick<User, "id" | "name" | "email">;
  };
  productVariant: ProductVariant & {
    product: Pick<Product, "id" | "name" | "images">;
  };
};

export type StoreOrdersResponse = {
  orders: StoreOrderItem[];
};

const fetchSellerOrders = async () => {
  const res = await fetch(`/api/store/orders`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch products.");
  }
  return res.json();
};

export function OrderManagement() {
  const {
    data: orders,
    isLoading,
    isError,
    error,
  } = useQuery<StoreOrdersResponse, Error>({
    queryKey: ["storeOrders"],
    queryFn: fetchSellerOrders,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });

  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Order Management
      </h2>

      <div className="flex space-x-4 mb-6">
        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
          <ListOrdered className="h-5 w-5" /> View New Orders
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5" /> View All Orders
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>
        <p className="text-gray-700">
          This section will display a list of your recent orders, their status,
          and quick actions for fulfillment.
        </p>
        <div className="mt-6">
          {orders && orders.orders.length > 0 ? (
            <ul className="space-y-4">
              {orders.orders.map((order) => (
                <li
                  key={order.order.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold">
                        Order #{order.order.id}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Buyer: {order.order.buyer.name} (
                        {order.order.buyer.email})
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-5 w-5" /> View Details
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent orders found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
