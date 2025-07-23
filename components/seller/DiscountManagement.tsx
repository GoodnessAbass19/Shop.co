// components/seller/DiscountManagement.tsx
"use client";

import React from "react"; // Removed useState as modal logic is gone
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Not strictly needed here anymore, but keeping for consistency
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, PlusCircle, Edit, Trash2, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/Hooks/use-toast";
import { Discount, Product } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link"; // Import Link for navigation
import { useSellerStore } from "@/Hooks/use-store-context";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { useRouter } from "next/navigation";

// Extend Discount type for data fetching
type DiscountWithProducts = Discount & {
  products: Pick<Product, "id" | "name">[];
};

// Function to fetch seller's discounts
const fetchSellerDiscounts = async (
  storeId: string
): Promise<DiscountWithProducts[]> => {
  const res = await fetch(`/api/store/discounts?storeId=${storeId}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch discounts.");
  }
  const data = await res.json();
  return data.discounts;
};

// Function to delete a discount
const deleteDiscount = async (discountId: string) => {
  const res = await fetch(`/api/seller/discounts/${discountId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to delete discount.");
  }
  return res.json();
};

export function DiscountManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useSellerStore();
  const { id: storeId } = store;
  const Router = useRouter();

  // Removed showFormModal and editingDiscount states

  const {
    data: discounts,
    isLoading,
    isError,
    error,
  } = useQuery<DiscountWithProducts[], Error>({
    queryKey: ["sellerDiscounts", storeId],
    queryFn: () => fetchSellerDiscounts(storeId),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!storeId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      toast({
        title: "Discount Deleted",
        description: "Discount has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["sellerDiscounts", storeId] });
      queryClient.invalidateQueries({ queryKey: ["sellerProducts", storeId] }); // Invalidate product queries if they display discounts
      queryClient.invalidateQueries({
        queryKey: ["sellerDashboardSummary", storeId],
      }); // If discounts affect summary
      Router.refresh(); // Refresh the page to reflect changes
    },
    onError: (err: any) => {
      toast({
        title: "Deletion Failed",
        description: err.message || "Could not delete discount.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (discountId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this discount? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate(discountId);
    }
  };

  const getDiscountStatus = (
    discount: Discount
  ): {
    text: string;
    variant:
      | "default"
      | "destructive"
      | "secondary"
      | "info"
      | "success"
      | "outline"
      | "warning"
      | null
      | undefined;
  } => {
    const now = new Date();
    const starts = new Date(discount.startsAt);
    const expires = new Date(discount.expiresAt);

    if (!discount.isActive) {
      return { text: "Inactive", variant: "secondary" };
    }
    if (now < starts) {
      return { text: "Upcoming", variant: "info" };
    }
    if (now > expires) {
      return { text: "Expired", variant: "destructive" };
    }
    return { text: "Active", variant: "success" };
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
        Error loading discounts:{" "}
        {error?.message || "An unknown error occurred."}
        <p className="text-sm mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Discount Management for {store.name}
      </h2>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <HoverPrefetchLink href="/your/store/dashboard/discounts/add">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle className="h-5 w-5" /> Create New Discount
          </Button>
        </HoverPrefetchLink>
      </div>

      {/* Discounts Table */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">
          Your Discounts ({discounts?.length || 0})
        </h3>
        {discounts?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Tag className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">
              No discounts found. Create one to get started!
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Starts At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts?.map((discount) => {
                const status = getDiscountStatus(discount);
                return (
                  <TableRow key={discount.id}>
                    <TableCell className="font-semibold text-blue-700">
                      {discount.code}
                    </TableCell>
                    <TableCell>
                      {discount.percentage !== null
                        ? "Percentage"
                        : "Fixed Amount"}
                    </TableCell>
                    <TableCell>
                      {discount.percentage !== null
                        ? `${discount.percentage}%`
                        : `$${discount.amount?.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {discount.products && discount.products.length > 0
                        ? `${discount.products.length} Product(s)`
                        : "All Products"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(discount.startsAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(discount.expiresAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <HoverPrefetchLink
                        href={`/your/store/dashboard/discounts/${discount.id}/edit`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mr-1"
                          title="Edit Discount"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </HoverPrefetchLink>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(discount.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete Discount"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
