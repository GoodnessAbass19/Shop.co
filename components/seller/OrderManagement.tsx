// components/seller/OrderManagement.tsx
"use client";

import React, { useMemo, useRef, useState, useEffect } from "react"; // Added useEffect
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
import { HoverPrefetchLink } from "@/lib/HoverLink";

// Extend Order type for data fetching
export type OrderWithRelations = Order & {
  buyer: Pick<User, "id" | "name" | "email"> | null;
  address: Address | null;
  items: (OrderItem & {
    productVariant: ProductVariant & {
      product: Pick<Product, "name" | "images" | "slug">;
    };
  })[];
};

// Define the shape of the data expected from the API
export interface OrdersApiResponse {
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
  // Only append status filter if it's not 'ALL'
  if (statusFilter && statusFilter !== "ALL")
    queryParams.append("status", statusFilter.toString());
  if (searchQuery) queryParams.append("search", searchQuery.toString());
  if (page) queryParams.append("page", page.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());

  // Corrected API endpoint to match /api/seller/orders
  const res = await fetch(`/api/store/orders?${queryParams.toString()}`);

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json(); // Try to parse JSON error
    } catch (e) {
      // If response is not JSON, or parsing fails, use status text
      throw new Error(
        `HTTP error! status: ${res.status}, message: ${res.statusText}`
      );
    }
    throw new Error(errorData.error || "Failed to fetch orders.");
  }

  const data = await res.json();

  // Explicitly check if data is null or undefined after parsing
  // This prevents the "Query data cannot be undefined" error
  if (data === null || data === undefined) {
    throw new Error("Received empty or invalid data from the server.");
  }

  return data;
};

export function OrderManagement() {
  const { store } = useSellerStore();
  const [active, setActive] = useState(false); // State to control prefetching
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // 'ALL' or a specific OrderStatus
  const [inputValue, setInputValue] = useState(""); // State for the input value (controlled)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); // State for the debounced search query
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Items per page

  // useEffect to debounce the search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(inputValue);
      setCurrentPage(1); // Reset to first page on search query change
    }, 300); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]); // Re-run effect when inputValue changes

  const { data, isLoading, isError, error } = useQuery<
    OrdersApiResponse,
    Error
  >({
    queryKey: [
      "sellerOrders",
      store.id,
      statusFilter,
      debouncedSearchQuery, // Use the debounced search query here
      currentPage,
      pageSize,
    ],
    queryFn: fetchSellerOrders as any,
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
        return "success";
      case OrderStatus.PENDING:
        return "warning";
      case OrderStatus.SHIPPED:
        return "info";
      case OrderStatus.DELIVERED:
        return "default";
      case OrderStatus.CANCELLED:
        return "destructive";
      case OrderStatus.REFUNDED:
        return "destructive";
        // case OrderStatus.RETURNED:
        //   return "secondary";
        // case OrderStatus.FAILED_DELIVERY:
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
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
    <div className="space-y-8 p-4 md:p-8">
      <h2 className="text-3xl font-bold mb-6">
        Order Management for {store.name}
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by Order ID..."
            value={inputValue} // Controlled by inputValue state
            onChange={(e) => setInputValue(e.target.value)} // Update inputValue immediately
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
          value={statusFilter} // Control the Select component's value
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
      <div className="p-6 rounded-lg shadow-md overflow-x-auto">
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
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusDisplayName(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <HoverPrefetchLink
                      // prefetch={active ? null : false}
                      // onMouseEnter={() => setActive(true)}
                      href={`/your/store/dashboard/orders/${order.id}`}
                    >
                      <Button variant="outline" size="sm" className="mr-2">
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </HoverPrefetchLink>
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
