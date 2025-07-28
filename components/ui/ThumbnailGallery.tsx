"use client";
import { useToast } from "@/Hooks/use-toast";
import { cn } from "@/lib/utils";
import { images } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Heart, Loader2 } from "lucide-react";

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

const ThumbnailGallery = ({
  images,
  id,
  name,
}: {
  images: images;
  id: string;
  name: string;
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistStatus, isLoading: isCheckingWishlist } = useQuery({
    queryKey: ["wishlistStatus", id], // Unique key for this product's wishlist status
    queryFn: () => checkWishlistStatus(id),
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
        description: `${name} has been added to your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", id],
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
        description: `${name} has been removed from your wishlist.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["wishlistStatus", id],
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
      removeMutation.mutate(id);
    } else {
      addMutation.mutate(id);
    }
  }, [isWishlisted, id, isCheckingWishlist, addMutation, removeMutation]);

  useEffect(() => {
    // Set the first image as the initial selected image when the component mounts.
    setSelectedImageIndex(0);
  }, []);

  const selectImage = (index: any) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="flex flex-col-reverse md:flex-row flex-1 flex-grow-0 justify-start items-start gap-5 overflow-hidden">
      <div className="">
        <div className="grid md:grid-cols-1 grid-cols-4 gap-4 justify-center items-center">
          {images.map((image, index) => (
            <div
              key={index}
              className={`cursor-pointer max-w-[100px] md:max-w-[110px] rounded-2xl ${
                index === selectedImageIndex
                  ? "border-2 brightness-100 contrast-100"
                  : "brightness-50  hover:brightness-75"
              }`}
              onClick={() => selectImage(index)}
            >
              <Image
                width={500}
                height={500}
                src={image.url}
                alt={`Thumbnail ${index}`}
                loading="lazy"
                className="w-full md:rounded-lg hover:shadow-md transition duration-300 transform rounded-2xl"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:max-w-[480px] flex-grow order-1 md:order-2 aspect-square relative overflow-hidden">
        {images.length > 0 && (
          <div>
            <Image
              width={1000}
              height={1000}
              priority
              src={images[selectedImageIndex].url}
              alt={`Selected Image ${selectedImageIndex}`}
              className="md:h-full w-[372px] h-[444px] md:w-full w border-2 border-gray-200 object-cover object-center shadow-sm dark:border-gray-800 sm:rounded-2xl overflow-clip"
            />
          </div>
        )}

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
    </div>
  );
};

export default ThumbnailGallery;
