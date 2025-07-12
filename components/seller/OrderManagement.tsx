// components/seller/OrderManagement.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShoppingBag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Order,
  OrderItem,
  User,
  Address,
  Product,
  ProductVariant,
  OrderStatus,
} from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge"; // Assuming you have shadcn/ui Badge
import { useSellerStore } from "@/Hooks/use-store-context";

// Extend Order type for data fetching
type OrderWithRelations = Order & {
  buyer: Pick<User, "id" | "name" | "email"> | null;
  address: Address | null;
  items: (OrderItem & {
    productVariant: ProductVariant & {
      product: Pick<Product, "name" | "images" | "slug">;
    };
  })[];
};

// Define the shape of the data expected from the API
interface OrdersApiResponse {
  orders: OrderWithRelations[];
  totalOrders: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Define the minimal structure of the store prop needed by this component
interface OrderManagementProps {
  store: {
    id: string;
    name: string;
  };
}

// Function to fetch seller's orders
const fetchSellerOrders = async ({
  queryKey,
}: {
  queryKey: (string | number | undefined)[];
}): Promise<OrdersApiResponse> => {
  const [_key, storeId, statusFilter, searchQuery, page, pageSize] = queryKey;
  const queryParams = new URLSearchParams();

  if (storeId) queryParams.append("storeId", storeId.toString());
  if (statusFilter) queryParams.append("status", statusFilter.toString());
  if (searchQuery) queryParams.append("search", searchQuery.toString());
  if (page) queryParams.append("page", page.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());

  const res = await fetch(`/api/store/orders?${queryParams.toString()}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch orders.");
  }
  return res.json();
};

export function OrderManagement() {
  const { store } = useSellerStore();
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // 'ALL' or a specific OrderStatus
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Items per page

  const { data, isLoading, isError, error } = useQuery<
    OrdersApiResponse,
    Error
  >({
    queryKey: [
      "sellerOrders",
      store.id,
      statusFilter,
      searchQuery,
      currentPage,
      pageSize,
    ],
    queryFn: fetchSellerOrders as any, // Type assertion to ensure correct return type
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!store.id, // Only run query if storeId is available
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;
  const hasNextPage = data?.hasNextPage || false;
  const hasPreviousPage = data?.hasPreviousPage || false;

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
        return "success"; // Assuming you have a 'success' variant
      case OrderStatus.PENDING:
        return "warning"; // Assuming 'warning' variant
      case OrderStatus.SHIPPED:
        return "info"; // Assuming 'info' variant
      case OrderStatus.DELIVERED:
        return "default";
      case OrderStatus.CANCELLED:
        return "destructive";
      case OrderStatus.REFUNDED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusDisplayName = (status: OrderStatus) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading orders: {error?.message || "An unknown error occurred."}
        <p className="text-sm mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Order Management for {store.name}
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <Select
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1); // Reset to first page on filter change
          }}
          defaultValue="ALL"
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(OrderStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {getStatusDisplayName(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">
          Your Orders ({data?.totalOrders || 0})
        </h3>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">No orders found matching your criteria.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {order.buyer?.name || order.buyer?.email || "Guest"}
                  </TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(order.status)}
                      // className="w-full text-center flex justify-center items-center"
                    >
                      {getStatusDisplayName(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/your/store/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="mr-2">
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </Link>
                    {/* Add Update Status button/modal here later */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={!hasPreviousPage || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!hasNextPage || isLoading}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
