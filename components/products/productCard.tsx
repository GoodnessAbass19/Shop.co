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

type ProductData = Product & {
  variants: ProductVariant[];
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

  return (
    <div className="overflow-hidden relative shadow-xs rounded-md">
      <HoverPrefetchLink
        href={`/products/${item?.slug}`}
        className="w-full h-full"
      >
        {/* {item.images[0]?.url && ( */}
        <Image
          src={
            loading ? "https://via.placeholder.com/200" : `${item?.images?.[0]}`
          }
          alt={item?.name || "product"}
          blurDataURL="https://via.placeholder.com/200"
          width={500}
          height={500}
          className="object-cover object-center rounded-md h-[260px]"
        />
        {/* )} */}
        <h2 className="font-medium text-base capitalize text-start font-sans line-clamp-1">
          {item?.name}
        </h2>
        <div className="space-y-2">
          <span className="text-lg font-semibold">
            {formatCurrencyValue(
              item?.variants[0].price || item?.variants[0].salePrice
            )}
          </span>

          {item?.variants[0].salePrice && (
            <span className="line-through text-sm text-gray-500 decoration-gray-500 ml-2 dark:text-white dark:decoration-white">
              {formatCurrencyValue(item?.variants[0].price)}
            </span>
          )}
          {isSaleActive(
            item.variants[0].saleStartDate,
            item.variants[0].saleEndDate
          ) && (
            <span className="font-normal text-sm text-start text-white font-sans absolute top-1 right-1 bg-black rounded-full p-1">
              <p className="">
                {formatPercentage(
                  calculatePercentageChange(
                    item.variants[0].price,
                    item.variants[0].salePrice
                  ),
                  0,
                  true
                )}{" "}
                OFF
              </p>
            </span>
          )}
        </div>
      </HoverPrefetchLink>
    </div>
  );
};

export default ProductCard;
