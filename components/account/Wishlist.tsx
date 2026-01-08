"use client";

import { useQuery } from "@tanstack/react-query";
import React from "react";
import ProductCard from "../products/productCard";
import { Skeleton } from "../ui/skeleton";
import { Product, ProductVariant } from "@prisma/client";

const fetchWishlist = async () => {
  const res = await fetch("/api/wishlist", {
    cache: "no-store",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add any necessary authentication headers here
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch wishlist data.");
  }

  return res.json();
};

type ProductData = Product & {
  variants: ProductVariant[];
  images: { url: string }[];
};

const Wishlist = () => {
  const {
    data: products,
    isLoading: productLoading,
    error,
  } = useQuery({
    queryKey: ["wishlist-products"],
    queryFn: fetchWishlist,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="px-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Wishlist</h1>
      {productLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-md" />
          ))}
        </div>
      ) : products?.products?.length === 0 ? (
        <p className="text-center col-span-full text-muted-foreground">
          No products found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.wishlist.map((product: ProductData) => (
            <ProductCard
              item={product}
              key={product.id}
              loading={productLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
