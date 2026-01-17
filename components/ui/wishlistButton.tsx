"use client";

import { useToast } from "@/Hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { set } from "date-fns";
import { Heart, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

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

const WishlistButton = ({
  className,
  productId,
  name,
  children,
}: {
  className?: string;
  productId: string;
  name: string;
  children?: React.ReactNode;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: wishlistStatus, isLoading: isCheckingWishlist } = useQuery({
    queryKey: ["wishlistStatus", productId], // Unique key for this item's wishlist status
    queryFn: () => checkWishlistStatus(productId),
    staleTime: 10 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on 401 (Unauthorized)
  });

  const isWishlisted = wishlistStatus?.isWishlisted || false;

  // Mutation for adding to wishlist
  const addMutation = useMutation({
    mutationFn: addProductToWishlist,
    onSuccess: () => {
      setIsUpdating(false);
      toast({
        title: "Added to Wishlist",
        description: `${name} has been added to your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", productId],
      }); // Invalidate to refetch status
      queryClient.invalidateQueries({ queryKey: ["wishlist"] }); // Invalidate the full wishlist query
    },
    onError: (error: any) => {
      setIsUpdating(false);
      toast({
        title: "Failed to Add",
        description: error.message || "Could not add item to wishlist.",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing from wishlist
  const removeMutation = useMutation({
    mutationFn: removeProductFromWishlist,
    onSuccess: () => {
      setIsUpdating(false);
      toast({
        title: "Removed from Wishlist",
        description: `${name} has been removed from your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", productId],
      }); // Invalidate to refetch status
      queryClient.invalidateQueries({ queryKey: ["wishlist"] }); // Invalidate the full wishlist query
    },
    onError: (error: any) => {
      setIsUpdating(false);
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
      removeMutation.mutate(productId);
    } else {
      addMutation.mutate(productId);
    }
  }, [
    isWishlisted,
    productId,
    isCheckingWishlist,
    addMutation,
    removeMutation,
  ]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsUpdating(true);
        handleWishlistToggle();
      }}
      disabled={addMutation.isPending || removeMutation.isPending}
      className={cn("flex items-center gap-1", className)}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isUpdating ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={`h-5 w-5 transition-colors ${
            isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
          }`}
        />
      )}
      {children}
    </button>
  );
};

export default WishlistButton;
