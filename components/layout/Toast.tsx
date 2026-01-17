"use client";

import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/Hooks/use-toast";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { Loader2, ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  productName: string; // Renamed 'name' to 'productName' for clarity
  onAddToCartClick: () => void; // The function to call when button is clicked
  isDisabled: boolean; // Renamed 'disabled' to 'isDisabled' to avoid conflict with native disabled
  isAddingToCart: boolean; // New prop to indicate loading state for the button
}

export function AddToCartButton({
  productName,
  onAddToCartClick,
  isDisabled,
  isAddingToCart,
}: AddToCartButtonProps) {
  const { toast } = useToast();

  const handleClick = () => {
    onAddToCartClick(); // Execute the function passed from parent
    toast({
      title: "Adding To Cart...", // Title changes based on pending state
      description: isAddingToCart
        ? `Adding ${productName} to cart...`
        : `${productName} added to cart`,
      action: (
        <ToastAction altText="Go to cart">
          <HoverPrefetchLink href={"/cart"}>Go to cart</HoverPrefetchLink>
        </ToastAction>
      ),
    });
  };

  return (
    <Button
      className="flex items-center justify-center w-full h-10 text-lg border border-black text-white text-center bg-black dark:bg-white dark:text-black hover:bg-white hover:text-black rounded-full flex-grow transition-transform delay-150 duration-200 ease-in-out"
      variant="outline"
      disabled={isDisabled || isAddingToCart}
      onClick={handleClick}
    >
      {isAddingToCart ? (
        <Loader2 className="animate-spin mr-2 h-5 w-5" /> // Show spinner when adding
      ) : (
        <ShoppingCart className="w-5 h-5 mr-2" /> // Show cart icon normally
      )}
      {isAddingToCart ? "Adding..." : "Add To Cart"}
    </Button>
  );
}
