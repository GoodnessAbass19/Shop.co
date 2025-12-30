"use client";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { separateStringByComma, SORT_OPTIONS } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import CategoryProductCard from "./CategoryProductCard";
import Pagination from "../ui/Pagination";
import { Product, ProductVariant } from "@prisma/client";

// Fetch sorted products in the category
const fetchSubSubCategoryProducts = async ({
  category,
  sort,
  page,
  limit,
}: {
  category: string;
  sort: string;
  page: number;
  limit?: number;
}) => {
  const res = await fetch(
    `/api/subsubcategories/${category}/products?sort=${sort}&page=${page}&limit=${limit}`
  );
  const data = await res.json();
  return data;
};

type ProductData = Product & {
  variants: ProductVariant[];
};

const SubSubCategory = ({ param }: { param: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") || "recent";
  const pageParam = Number(searchParams.get("page")) || 1;

  const [sort, setSort] = useState(sortParam);
  const [page, setPage] = useState(pageParam);
  // Get initial sort state from query params
  const currentSort = searchParams.get("sort") || "recent";

  const {
    data: products,
    isLoading: productLoading,
    error,
  } = useQuery({
    queryKey: ["subsubcategory-product", param, sort, page],
    queryFn: ({ queryKey }) =>
      fetchSubSubCategoryProducts({
        category: queryKey[1] as string,
        sort,
        page,
        limit,
      }),
    enabled: !!param,
    staleTime: 10 * 60 * 1000,
  });

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    params.set("page", "1"); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
    setSort(value);
    setPage(1);
  };

  // Subcategories with toggle logic
  const limit = 5;

  return (
    <div className="w-full space-y-10">
      {/* Product Sorting */}
      {!productLoading && !error ? (
        <div className="flex justify-between items-center px-5 mx-auto">
          <div className="rounded-full border border-black p-2 flex gap-2 capitalize font-semibold font-sans text-sm">
            <SlidersHorizontal className="w-4 h-4" /> all filters
          </div>
          <Select onValueChange={handleSortChange} defaultValue={currentSort}>
            <SelectTrigger className="w-60 rounded-full border border-black capitalize font-medium font-sans">
              {/* <SelectValue placeholder="Sort By" /> */}
              Sort By: {separateStringByComma(sort)}
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex justify-between items-center px-5 mx-auto">
          <div className="rounded-full border border-black p-2 flex gap-2 capitalize font-semibold font-sans text-sm">
            <SlidersHorizontal className="w-4 h-4" /> all filters
          </div>
          <Select onValueChange={handleSortChange} defaultValue={currentSort}>
            <SelectTrigger className="w-60 rounded-full border border-black capitalize font-medium font-sans">
              {/* <SelectValue placeholder="Sort By" /> */}
              Sort By: {separateStringByComma(sort)}
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
        {productLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-md" />
          ))
        ) : products?.products?.length === 0 ? (
          <p className="text-center col-span-full text-muted-foreground">
            No products found in this category.
          </p>
        ) : (
          products?.products?.map((product: ProductData) => (
            <CategoryProductCard product={product} key={product.id} />
          ))
        )}
      </div>
      <Pagination count={products?.total} page={products?.page} />
    </div>
  );
};

export default SubSubCategory;
