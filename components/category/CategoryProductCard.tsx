"use client";

import { useToast } from "@/Hooks/use-toast";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useCallback } from "react";
import { Button } from "../ui/button";
import {
  calculatePercentageChange,
  cn,
  formatPercentage,
  isSaleActive,
} from "@/lib/utils";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { Product, ProductReview, ProductVariant } from "@prisma/client";

const checkWishlistStatus = async (
  productId: string
): Promise<{ isWishlisted: boolean }> => {
  const res = await fetch(`/api/wishlist/status?productId=${productId}`);
  if (!res.ok) {
    // If unauthorized, it means user is not logged in, so it's not wishlisted for them
    if (res.status === 401) return { isWishlisted: false };
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to check wishlist status.");
  }
  return res.json();
};

// Function to add a product to the wishlist
const addProductToWishlist = async (productId: string) => {
  const res = await fetch("/api/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to add to wishlist.");
  }
  return res.json();
};

// Function to remove a product from the wishlist
const removeProductFromWishlist = async (productId: string) => {
  const res = await fetch(`/api/wishlist/${productId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to remove from wishlist.");
  }
  return res.json();
};

type ProductData = Product & {
  variants: ProductVariant[];
  reviews?: ProductReview[];
  averageRating?: number;
};

const CategoryProductCard = ({ product }: { product: ProductData }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistStatus, isLoading: isCheckingWishlist } = useQuery({
    queryKey: ["wishlistStatus", product.id], // Unique key for this product's wishlist status
    queryFn: () => checkWishlistStatus(product.id),
    staleTime: 10 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on 401 (Unauthorized)
  });

  const isWishlisted = wishlistStatus?.isWishlisted || false;

  // Mutation for adding to wishlist
  const addMutation = useMutation({
    mutationFn: addProductToWishlist,
    onSuccess: () => {
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", product.id],
      }); // Invalidate to refetch status
      queryClient.invalidateQueries({ queryKey: ["wishlist"] }); // Invalidate the full wishlist query
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add",
        description: error.message || "Could not add product to wishlist.",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing from wishlist
  const removeMutation = useMutation({
    mutationFn: removeProductFromWishlist,
    onSuccess: () => {
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", product.id],
      }); // Invalidate to refetch status
      queryClient.invalidateQueries({ queryKey: ["wishlist"] }); // Invalidate the full wishlist query
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove",
        description: error.message || "Could not remove product from wishlist.",
        variant: "destructive",
      });
    },
  });

  const handleWishlistToggle = useCallback(() => {
    if (
      isCheckingWishlist ||
      addMutation.isPending ||
      removeMutation.isPending
    ) {
      return; // Prevent multiple clicks while loading/mutating
    }

    if (isWishlisted) {
      removeMutation.mutate(product.id);
    } else {
      addMutation.mutate(product.id);
    }
  }, [
    isWishlisted,
    product.id,
    isCheckingWishlist,
    addMutation,
    removeMutation,
  ]);

  return (
    <div className="relative">
      <HoverPrefetchLink
        href={`/products/${product.slug}`}
        key={product.id}
        className="rounded-lg space-y-1 overflow-hidden"
      >
        <Image
          src={product?.images?.[0] || "https://placehold.co/300x300"}
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-[160px] md:h-[190px] lg:h-full object-cover object-center rounded-sm"
        />
        <div className="px-1 leading-none">
          <h4 className="text-sm sm:text-base font-serif font-medium line-clamp-1 capitalize">
            {product.name}
          </h4>
          <div>
            {product.reviews!.length > 0 && (
              <span className="text-black text-2xl font-normal flex items-center gap-1">
                {"★".repeat(product.averageRating!)}
                {"☆".repeat(5 - product.averageRating!)}{" "}
                <span className="text-base">({product.reviews!.length})</span>
              </span>
            )}
          </div>
          <div className="flex gap-0.5 items-center">
            <p className="text-lg uppercase font-semibold font-sans text-black mt-0.5">
              {formatCurrencyValue(
                product.variants[0].salePrice || product.variants[0].price
              )}
            </p>

            {product?.variants[0].salePrice && (
              <span className="line-through text-sm text-gray-500 decoration-gray-500 ml-2 dark:text-white dark:decoration-white">
                {formatCurrencyValue(product?.variants[0].price)}
              </span>
            )}
            {isSaleActive(
              product.variants[0].saleStartDate,
              product.variants[0].saleEndDate
            ) && (
              <span className="font-normal text-sm text-center text-black font-sans">
                {formatPercentage(
                  calculatePercentageChange(
                    product.variants[0].price,
                    product.variants[0].salePrice
                  ),
                  0,
                  true
                )}{" "}
                OFF
              </span>
            )}
          </div>
        </div>
      </HoverPrefetchLink>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 right-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors duration-200",
          isWishlisted
            ? "text-red-500 hover:text-red-600"
            : "text-gray-500 hover:text-red-500",
          (isCheckingWishlist ||
            addMutation.isPending ||
            removeMutation.isPending) &&
            "opacity-60 cursor-not-allowed"
        )}
        onClick={handleWishlistToggle}
        disabled={
          isCheckingWishlist ||
          addMutation.isPending ||
          removeMutation.isPending
        }
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        {isCheckingWishlist ||
        addMutation.isPending ||
        removeMutation.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
        )}
      </Button>
    </div>
  );
};

export default CategoryProductCard;
