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

export type ProductFromApi = Product & {
  category: Pick<Category, "id" | "name" | "slug">;
  subCategory: Pick<SubCategory, "id" | "name" | "slug">;
  subSubCategory: Pick<SubSubCategory, "id" | "name" | "slug"> | null;
  variants: Pick<ProductVariant, "id" | "price" | "size" | "color" | "stock">[];
  store: Pick<Store, "id" | "name" | "slug">;
  discounts: Discount[]; // Include discounts
  averageRating: number; // Average rating from reviews
  reviews: ProductReview[]; // Include reviews
  // These are added by the API route's mapping:
  productName: string;
  lowestPrice: number; // The lowest base price (from variants or product)
  discountedPrice: number | null; // The price after discount
  images: { url: string }[]; // Transformed image array
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
  item: ProductFromApi;
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
            loading
              ? "https://via.placeholder.com/200"
              : `${item?.images?.[0]?.url}`
          }
          alt={item?.productName || "product"}
          blurDataURL="https://via.placeholder.com/200"
          width={500}
          height={500}
          className="object-cover object-center rounded-md h-[260px]"
        />
        {/* )} */}
        <h2 className="font-medium text-base capitalize text-start font-sans line-clamp-1">
          {item?.productName}
        </h2>
        <div className="space-y-2">
          <span className="text-lg font-semibold">
            {formatCurrencyValue(item?.price || item?.discountedPrice)}
          </span>

          {item?.discountedPrice && (
            <span className="line-through text-sm text-gray-500 decoration-gray-500 ml-2 dark:text-white dark:decoration-white">
              {formatCurrencyValue(item?.price)}
            </span>
          )}
          {item?.discountedPrice !== null && (
            <span className="font-normal text-sm text-start text-white font-sans absolute top-1 right-1 bg-black rounded-full p-1">
              <div className="">
                {item.discounts[0].percentage
                  ? `-${item.discounts[0].percentage}%`
                  : `-₦${item.discounts[0].amount}`}
                {/* {item.discounts[0].expiresAt &&
                  ` • Ends ${format(
                    new Date(item.discounts[0].expiresAt),
                    "PPP"
                  )}`} */}
              </div>
            </span>
          )}
        </div>
      </HoverPrefetchLink>
    </div>
  );
};

export default ProductCard;
