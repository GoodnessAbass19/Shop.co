"use client";

import {
  GET_PRODUCT_BY_SUBCATEGORY,
  GET_PRODUCT_BY_SUBCATEGORY_AND_SIZES,
} from "@/lib/query";
import { ProductData } from "@/types";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import ProductCard from "./productCard";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Pagination from "../ui/Pagination";
import FilterModal from "../ui/FilterModal";
import { SkeletonCard } from "../ui/SkeletonCard";

const SubcategoryProduct = ({
  title,
  category,
  subcategory,
}: {
  title: string;
  category: string;
  subcategory: string;
}) => {
  const param = useSearchParams();
  const rawSizes = param.get("size")?.split(",") || [];
  const page = param.get("page");
  const p = page ? parseInt(page) : 1;

  // Transform URL parameters into valid GraphQL enums
  const sizes = rawSizes.map((size) => size.toLowerCase()); // Convert to uppercase

  // Use the appropriate query and variables
  const isSizeFilterActive = sizes.length > 0;

  const { data, loading, error } = useQuery<ProductData>(
    isSizeFilterActive
      ? GET_PRODUCT_BY_SUBCATEGORY_AND_SIZES
      : GET_PRODUCT_BY_SUBCATEGORY,
    {
      variables: isSizeFilterActive
        ? {
            size: sizes,
            category: category,
            first: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
            subCategory: subcategory,
          }
        : {
            category: category,
            subCategory: subcategory,
            first: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
          },
      skip: false, // Ensure the query always runs
      notifyOnNetworkStatusChange: true,
    }
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 justify-between items-stretch pt-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium mb-4 capitalize text-ellipsis">
          {title}
        </h1>
        <div className="md:hidden block">
          <FilterModal />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-between items-stretch">
        {data?.products.map((product) => (
          <ProductCard key={product.id} item={product} loading={loading} />
        ))}
      </div>

      <div className="mt-10">
        <Pagination count={data?.products.length as number} page={p} />
      </div>
    </div>
  );
};

export default SubcategoryProduct;
