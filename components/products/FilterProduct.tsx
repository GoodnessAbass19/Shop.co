"use client";

import { GET_PRODUCT_BY_SIZES, GET_PRODUCTS_BY_TAGS } from "@/lib/query";
import { ProductData, productTags } from "@/types";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import ProductCard from "./productCard";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Pagination from "../ui/Pagination";
import { AdjustmentsVerticalIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FilterModal from "../ui/FilterModal";

const FilterProduct = ({ title, tag }: { title: string; tag: any }) => {
  const param = useSearchParams();
  const rawSizes = param.get("size")?.split(",") || [];
  const page = param.get("page");
  const p = page ? parseInt(page) : 1;

  // Transform URL parameters into valid GraphQL enums
  const sizes = rawSizes.map((size) => size.toLowerCase()); // Convert to uppercase

  // Use the appropriate query and variables
  const isSizeFilterActive = sizes.length > 0;

  const { data, loading, error } = useQuery<ProductData>(
    isSizeFilterActive ? GET_PRODUCT_BY_SIZES : GET_PRODUCTS_BY_TAGS,
    {
      variables: isSizeFilterActive
        ? {
            size: sizes,
            tag: tag,
            first: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
          }
        : { tag: tag, first: ITEM_PER_PAGE, skip: ITEM_PER_PAGE * (p - 1) }, // Default to "newArrivals" tag if no sizes
      skip: false, // Ensure the query always runs
      notifyOnNetworkStatusChange: true,
    }
  );

  // if (loading) {
  //   return (
  //     <div className="product-list">
  //       {Array.from({ length: 10 }).map((_, index) => (
  //         <SkeletonCard key={index} />
  //       ))}
  //     </div>
  //   );
  // }

  return (
    <div>
      {/* <div className="min-h-screen"> */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium mb-4 capitalize text-ellipsis">
          {title}
        </h1>
        <div className="md:hidden block">
          <FilterModal />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-between items-stretch pt-5">
        {data?.products.map((product) => (
          <ProductCard key={product.id} item={product} loading={loading} />
        ))}
      </div>
      {/* </div> */}
      <div className="mt-10">
        <Pagination count={data?.products.length as number} page={p} />
      </div>
    </div>
  );
};

export default FilterProduct;
