"use client";

import { useToast } from "@/Hooks/use-toast";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { Product } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ProductFromApi } from "../products/productCard";
import { HoverPrefetchLink } from "@/lib/HoverLink";

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

const CategoryProductCard = ({ product }: { product: ProductFromApi }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistStatus, isLoading: isCheckingWishlist } = useQuery({
    queryKey: ["wishlistStatus", product.id], // Unique key for this product's wishlist status
    queryFn: () => checkWishlistStatus(product.id),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
    <div className="relative overflow-hidden">
      <HoverPrefetchLink
        href={`/products/${product.slug}`}
        key={product.id}
        className="rounded-lg space-y-1"
      >
        <Image
          src={product?.images?.[0] || "https://placehold.co/300x300"}
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-[250px] object-cover object-center rounded-sm"
        />
        <div className="px-1.5 leading-tight">
          <h4 className="text-base font-normal line-clamp-1">{product.name}</h4>
          <div>
            {product.reviews.length > 0 && (
              <span className="text-black text-2xl font-normal flex items-center gap-1">
                {"★".repeat(product.averageRating)}
                {"☆".repeat(5 - product.averageRating)}{" "}
                <span className="text-base">({product.reviews.length})</span>
              </span>
            )}
          </div>
          <div className="flex gap-0.5 items-center">
            <p className="text-lg uppercase font-semibold font-sans text-black mt-1">
              {formatCurrencyValue(product.discountedPrice || product.price)}
            </p>

            {product?.discountedPrice && (
              <span className="line-through text-sm text-gray-500 decoration-gray-500 ml-2 dark:text-white dark:decoration-white">
                {formatCurrencyValue(product?.price)}
              </span>
            )}
            {product?.discountedPrice !== null && (
              <span className="font-normal text-sm text-center text-black font-sans">
                ({product?.discounts?.[0]?.percentage}% off)
                {/* {percentageDifference(
              // @ts-ignore
              item?.price,
              item?.discountedPrice
            )} */}
              </span>
            )}
          </div>
        </div>
      </HoverPrefetchLink>
      {/* <span className="font-light text-sm text-center text-black bg-white rounded-full p-2 absolute top-1 right-1">
          <Heart className="w-4 h-4" />
        </span> */}
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
