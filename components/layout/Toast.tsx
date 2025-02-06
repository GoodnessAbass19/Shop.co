"use client";

import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/Hooks/use-toast";
import { createCartItem } from "@/lib/actions";
import { useCartStore } from "@/store/cart-store";
import { CartProduct } from "@/types";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export function AddToCartButton({ name, data }: { name: string; data: any }) {
  const { toast } = useToast();
  const addToCart = useCartStore((state) => state.addToCart);
  const { user } = useUser();

  return (
    <Button
      className="flex items-center justify-center w-full h-10 text-lg border border-black text-white text-center bg-black dark:bg-white dark:text-black hover:bg-white hover:text-black rounded-full flex-grow transition-transform delay-150 duration-200 ease-in-out"
      variant="outline"
      onClick={() => {
        addToCart(data);
        createCartItem(
          { success: false, error: false },
          { userId: user?.id, ...data }
        );
        toast({
          title: "Added To Cart",
          description: `${name} added to cart`,
          action: (
            <ToastAction altText="Go to cart">
              <Link href={"/cart"}>Go to cart</Link>
            </ToastAction>
          ),
        });
      }}
    >
      Add To Cart
    </Button>
  );
}
