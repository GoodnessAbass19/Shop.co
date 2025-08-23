// components/seller/InventoryManagement.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/Hooks/use-toast";
import { useSellerStore } from "@/Hooks/use-store-context";
import { cn } from "@/lib/utils";
import { HoverPrefetchLink } from "@/lib/HoverLink";

// Define the shape of an inventory item (either product or variant)
interface InventoryItem {
  type: "product" | "variant"; // Indicates if it's a main product or a variant
  id: string; // ID of the product or variant
  productId: string; // Parent product ID
  productName: string;
  productSlug: string;
  productImage: string | null;
  variantName: string; // "N/A" for products without variants
  currentStock: number;
  unitPrice: number;
  isLowStock: boolean;
  sku: string | null;
}

// Define the shape of the data expected from the API
interface InventoryApiResponse {
  inventoryItems: InventoryItem[];
  totalItems: number; // Total products (not flattened items)
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  lowStockThreshold: number;
}

// Define the minimal structure of the store prop needed by this component
interface InventoryManagementProps {
  store: {
    id: string;
    name: string;
  };
}

// Function to fetch seller's inventory
const fetchSellerInventory = async ({
  queryKey,
}: {
  queryKey: (string | number | boolean | undefined)[];
}): Promise<InventoryApiResponse> => {
  const [_key, storeId, lowStockFilter, searchQuery, page, pageSize] = queryKey;
  const queryParams = new URLSearchParams();

  if (storeId) queryParams.append("storeId", storeId.toString());
  if (lowStockFilter === true) queryParams.append("lowStock", "true");
  if (searchQuery) queryParams.append("search", searchQuery.toString());
  if (page) queryParams.append("page", page.toString());
  if (pageSize) queryParams.append("pageSize", pageSize.toString());

  const res = await fetch(`/api/store/inventory?${queryParams.toString()}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch inventory.");
  }
  return res.json();
};

// Function to update stock
const updateStock = async (data: {
  id: string;
  newStock: number;
  type: "product" | "variant";
}) => {
  const res = await fetch(`/api/store/inventory/${data.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newStock: data.newStock, type: data.type }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update stock.");
  }
  return res.json();
};

export function InventoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useSellerStore();

  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Items per page

  // State to manage inline stock editing
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number | "">("");
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input field

  const { data, isLoading, isError, error } = useQuery<
    InventoryApiResponse,
    Error
  >({
    queryKey: [
      "sellerInventory",
      store.id,
      lowStockFilter,
      searchQuery,
      currentPage,
      pageSize,
    ],
    queryFn: () =>
      fetchSellerInventory({
        queryKey: [
          "sellerInventory",
          store.id,
          lowStockFilter,
          searchQuery,
          currentPage,
          pageSize,
        ],
      }),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    enabled: !!store.id,
  });

  const inventoryItems = data?.inventoryItems || [];
  const totalPages = data?.totalPages || 1;
  const lowStockThreshold = data?.lowStockThreshold || 10;
  const hasNextPage = data?.hasNextPage || false;
  const hasPreviousPage = data?.hasPreviousPage || false;

  const updateStockMutation = useMutation({
    mutationFn: updateStock,
    onSuccess: (data) => {
      toast({
        title: "Stock Updated",
        description: "Product stock has been successfully updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["sellerInventory", store.id],
      }); // Invalidate to refetch
      queryClient.invalidateQueries({
        queryKey: ["sellerDashboardSummary", store.id],
      }); // Update dashboard summary
      setEditingStockId(null); // Exit editing mode
      setTempStockValue(""); // Clear temp value
    },
    onError: (err: any) => {
      toast({
        title: "Stock Update Failed",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
      setEditingStockId(null); // Exit editing mode
      setTempStockValue(""); // Clear temp value
    },
  });

  // Effect to focus input when editing starts
  useEffect(() => {
    if (editingStockId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingStockId]);

  const handleEditClick = (item: InventoryItem) => {
    setEditingStockId(item.id);
    setTempStockValue(item.currentStock);
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string to clear the input, or convert to number
    setTempStockValue(value === "" ? "" : Math.max(0, parseInt(value, 10)));
  };

  const handleStockSave = (item: InventoryItem) => {
    if (tempStockValue === "" || isNaN(Number(tempStockValue))) {
      toast({
        title: "Invalid Stock",
        description: "Please enter a valid number for stock.",
        variant: "destructive",
      });
      return;
    }
    const newStock = Number(tempStockValue);
    if (newStock < 0) {
      toast({
        title: "Invalid Stock",
        description: "Stock cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    updateStockMutation.mutate({
      id: item.id,
      newStock: newStock,
      type: item.type,
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    item: InventoryItem
  ) => {
    if (e.key === "Enter") {
      handleStockSave(item);
    } else if (e.key === "Escape") {
      setEditingStockId(null);
      setTempStockValue("");
    }
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
        Error loading inventory:{" "}
        {error?.message || "An unknown error occurred."}
        <p className="text-sm mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-6">
        Inventory Management for {store.name}
      </h2>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by Product Name or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" />
        </div>
        <Select
          onValueChange={(value) => {
            setLowStockFilter(value === "true");
            setCurrentPage(1); // Reset to first page on filter change
          }}
          defaultValue="false"
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Filter Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">All Stock</SelectItem>
            <SelectItem value="true">
              Low Stock ( &le; {lowStockThreshold})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <div className="p-6 rounded-lg shadow-md overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">
          Your Inventory ({data?.totalItems || 0} Products)
        </h3>
        {inventoryItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">
              No inventory items found matching your criteria.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Current Stock</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item: InventoryItem) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <HoverPrefetchLink href={`/products/${item.productSlug}`}>
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={60}
                          height={60}
                          className="rounded-md object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/60x60/e0e0e0/555555?text=No+Img";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs">
                          No Img
                        </div>
                      )}
                    </HoverPrefetchLink>
                  </TableCell>
                  <TableCell>
                    <HoverPrefetchLink
                      href={`/products/${item.productSlug}`}
                      className="font-medium hover:text-blue-600 hover:underline"
                    >
                      {item.productName}
                    </HoverPrefetchLink>
                  </TableCell>
                  <TableCell>
                    {item.variantName !== "N/A" ? (
                      item.variantName
                    ) : (
                      <span className="">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.sku || <span className="">N/A</span>}
                  </TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    {editingStockId === item.id ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        value={tempStockValue}
                        onChange={handleStockChange}
                        onBlur={() => handleStockSave(item)} // Save on blur
                        onKeyDown={(e) => handleKeyDown(e, item)}
                        min="0"
                        className="w-24 text-center"
                        disabled={updateStockMutation.isPending}
                      />
                    ) : (
                      <span
                        className={cn(
                          "font-bold text-lg cursor-pointer hover:text-blue-600 transition-colors flex items-center justify-center",
                          item.isLowStock ? "text-red-600" : ""
                        )}
                        onClick={() => handleEditClick(item)}
                        title="Click to edit stock"
                      >
                        {item.currentStock}
                        {item.isLowStock && (
                          <span aria-label="Low Stock!" title="Low Stock!">
                            <AlertTriangle className="inline-block h-4 w-4 ml-1 text-red-500" />
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {editingStockId === item.id ? (
                      <Button
                        size="sm"
                        onClick={() => handleStockSave(item)}
                        disabled={updateStockMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updateStockMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(item)}
                        disabled={updateStockMutation.isPending}
                      >
                        Edit Stock
                      </Button>
                    )}
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
            disabled={
              !hasPreviousPage || isLoading || updateStockMutation.isPending
            }
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
            disabled={
              !hasNextPage || isLoading || updateStockMutation.isPending
            }
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
