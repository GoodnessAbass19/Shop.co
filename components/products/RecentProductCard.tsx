"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { Product, SingleProduct } from "@/types";
import { GET_SINGLE_PRODUCT } from "@/lib/query";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import ProductCard from "./productCard";
import { SkeletonCard } from "../ui/SkeletonCard";

const RecentProduct = ({ url }: { url: string }) => {
  // Extract the slug from the URL
  const getSlugFromUrl = (url: string) => url.split("/").filter(Boolean).pop();
  const slug = getSlugFromUrl(url);

  const { loading, error, data } = useQuery<SingleProduct>(GET_SINGLE_PRODUCT, {
    variables: { slug },
    notifyOnNetworkStatusChange: true,
    skip: !slug, // Skip the query if slug is not valid
  });

  // if (!slug || error) {
  //   console.error(`Failed to fetch product for slug: ${slug}`, error);
  //   return null; // Return nothing if there's an error or invalid slug
  // }

  // Fallback for loading state
  // const product = data?.product || {
  //   slug: "",
  //   productName: "Loading...",
  //   price: 0,
  //   images: [{ url: "https://via.placeholder.com/500" }],
  // };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 justify-between items-stretch pt-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    // <Link
    //   href={product.slug || "#"}
    //   className="w-full rounded-md h-full overflow-hidden relative"
    // >
    //   <div className="w-full grid grid-rows-3">
    //     {/* Product Image */}
    //     <div className="rounded-md overflow-hidden shadow row-span-2 sm:max-w-full max-h-[240px]">
    //       <div className="w-full h-full">
    //         <Image
    //           src={product.images[0]?.url}
    //           width={500}
    //           height={500}
    //           alt={product.productName || "Product Image"}
    //           className="w-full object-cover"
    //           placeholder="blur"
    //           blurDataURL={product.images[0]?.url}
    //           priority
    //         />
    //       </div>
    //     </div>

    //     {/* Product Details */}
    //     <div className="flex flex-col mt-2 text-sm dark:text-white text-black">
    //       <h4 className="font-medium text-base">
    //         <span className="capitalize line-clamp-1">
    //           {product.productName}
    //         </span>
    //       </h4>
    //       <span className="capitalize font-bold text-sm">
    //         {formatCurrencyValue(product.price)}
    //       </span>
    //     </div>
    //   </div>
    // </Link>
    <ProductCard item={data?.product as Product} loading={loading} />
  );
};

export default RecentProduct;
