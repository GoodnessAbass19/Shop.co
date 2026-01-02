"use client";

import React, { useState, useMemo } from "react";
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
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Search,
  Package,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Product,
  ProductVariant,
  Category,
  SubCategory,
  SubSubCategory,
  ProductStatus,
} from "@prisma/client";
import Image from "next/image";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/Hooks/use-toast";
import { useSellerStore } from "@/Hooks/use-store-context";

// Extend Product type for data fetching
type ProductWithRelations = ProductVariant & {
  product: Product & {
    category: Category;
    subCategory: SubCategory | null;
    subSubCategory: SubSubCategory | null;
  };
};

/**
 * API Functions
 */
const fetchSellerProducts = async (
  storeId: string
): Promise<ProductWithRelations[]> => {
  const res = await fetch(`/api/store/products?storeId=${storeId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch products.");
  }
  return res.json();
};

const deleteProduct = async (productId: string) => {
  const res = await fetch(`/api/store/products/${productId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to delete product.");
  }
  return res.json();
};

const updateProductStatus = async ({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) => {
  const res = await fetch(`/api/store/products/${productId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update status.");
  }
  return res.json();
};

export function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useSellerStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Queries
   */
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<ProductWithRelations[], Error>({
    queryKey: ["sellerProducts", store?.id],
    queryFn: () => fetchSellerProducts(store.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!store?.id,
  });

  /**
   * Mutations
   */
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["sellerProducts", store.id] });
    },
    onError: (err: any) => {
      toast({
        title: "Deletion Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateProductStatus,
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Product visibility changed.",
      });
      queryClient.invalidateQueries({ queryKey: ["sellerProducts", store.id] });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handlers
   */
  const handleDelete = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(productId);
    }
  };

  const handleStatusToggle = (productId: string, currentStatus: string) => {
    const newStatus: ProductStatus =
      currentStatus === "ACTIVE" ? "DRAFT" : "ACTIVE";
    statusMutation.mutate({ productId, status: newStatus });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sellerSku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">Error: {error.message}</p>
        <Button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["sellerProducts"] })
          }
          variant="outline"
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Product Management
          </h2>
          <p className="text-muted-foreground">
            Manage inventory and visibility for {store?.name}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/your/store/dashboard/products/new")}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[70px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Sale price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-12 w-12 mb-2 opacity-20" />
                    <p>No products found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <div className="relative h-12 w-12 border rounded overflow-hidden bg-gray-50">
                      <Image
                        src={
                          variant.product.images?.[0] ||
                          "https://placehold.co/100x100?text=No+Image"
                        }
                        alt={variant.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="font-medium truncate capitalize">
                      {variant.product.name}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">
                    {variant.sellerSku}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">
                        {formatCurrencyValue(variant.price)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm">
                      {formatCurrencyValue(variant.salePrice)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        variant.quantity <= 7 ? "text-red-500 font-bold" : ""
                      }`}
                    >
                      {variant.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={variant.product.status === "ACTIVE"}
                        onCheckedChange={() =>
                          handleStatusToggle(
                            variant.product.id,
                            variant.product.status
                          )
                        }
                        disabled={statusMutation.isPending}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {variant.product.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          router.push(
                            `/your/store/dashboard/products/${variant.product.id}/edit`
                          )
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(variant.product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
