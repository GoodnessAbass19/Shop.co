// import { Product } from "@/types";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import Image from "next/image";
import { SkeletonCard } from "../ui/SkeletonCard";
import {
  Category,
  Product,
  ProductVariant,
  SubCategory,
  SubSubCategory,
  Store,
  Discount,
  ProductReview, // Import Discount type
} from "@prisma/client";
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/Hooks/use-toast";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import {
  calculatePercentageChange,
  formatPercentage,
  isSaleActive,
} from "@/lib/utils";
import { Heart } from "lucide-react";
import Link from "next/link";

type ProductData = Product & {
  variants: ProductVariant[];
  images: { url: string }[];
};

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

const ProductCard = ({
  item,
  loading,
}: {
  item: ProductData;
  loading: boolean;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistStatus, isLoading: isCheckingWishlist } = useQuery({
    queryKey: ["wishlistStatus", item.id], // Unique key for this item's wishlist status
    queryFn: () => checkWishlistStatus(item.id),
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
        description: `${item.name} has been added to your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", item.id],
      }); // Invalidate to refetch status
      queryClient.invalidateQueries({ queryKey: ["wishlist"] }); // Invalidate the full wishlist query
    },
    onError: (error: any) => {
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
      toast({
        title: "Removed from Wishlist",
        description: `${item.name} has been removed from your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", item.id],
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
      removeMutation.mutate(item.id);
    } else {
      addMutation.mutate(item.id);
    }
  }, [isWishlisted, item.id, isCheckingWishlist, addMutation, removeMutation]);

  if (loading) {
    return <div>{loading && <SkeletonCard />}</div>;
  }

  const firstVariant = item?.variants?.[0];
  const isOnSale =
    firstVariant &&
    isSaleActive(firstVariant.saleStartDate, firstVariant.saleEndDate);
  const currentPrice = isOnSale ? firstVariant.salePrice : firstVariant?.price;

  return (
    <div className="group flex flex-col rounded-xl border border-[#cfd9e7] dark:border-gray-700 bg-white dark:bg-surface-dark overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        <Link href={`/products/${item?.slug}`} className="block w-full h-full">
          <img
            src={
              item?.images?.[0]?.url || "https://via.placeholder.com/500x667"
            }
            alt={item?.name || "product"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={addMutation.isPending || removeMutation.isPending}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform active:scale-90 hover:bg-white"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>

        {/* Sale Badge */}
        {isOnSale && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-sm z-10">
            {/* <span className="bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider rounded-md shadow-sm"> */}
            {formatPercentage(
              calculatePercentageChange(
                item.variants[0].price,
                item.variants[0].salePrice
              ),
              0,
              true
            )}
            {/* </span> */}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2 flex flex-col gap-2 flex-1">
        <Link href={`/products/${item?.slug}`}>
          <h3 className="text-[#0d131b] dark:text-white text-sm font-semibold line-clamp-2 min-h-[2.5em]">
            {item?.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#0d131b] dark:text-white font-bold text-lg">
              {formatCurrencyValue(currentPrice)}
            </span>
            {isOnSale && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrencyValue(firstVariant.price)}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
