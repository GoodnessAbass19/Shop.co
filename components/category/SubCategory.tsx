"use client";
import { cn, separateStringByComma, SORT_OPTIONS } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import { Button } from "../ui/button";
import Pagination from "../ui/Pagination";
import CategoryProductCard from "./CategoryProductCard";
import { ArrowUp, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { Product, ProductVariant } from "@prisma/client";

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  subSubCategories: SubSubCategory[];
}

interface SubSubCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  subCategory: {
    id: string;
    name: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

// Fetch category details
const fetchSubCategory = async ({
  subcategory,
}: {
  subcategory: string;
}): Promise<SubCategory> => {
  const res = await fetch(`/api/subcategories/${subcategory}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch category data.");
  }
  return res.json();
};

// Fetch sorted products in the category
const fetchSubCategoryProducts = async ({
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
    `/api/subcategories/${category}/products?sort=${sort}&page=${page}&limit=${limit}`
  );
  const data = await res.json();
  return data;
};

type ProductData = Product & {
  variants: ProductVariant[];
};

const SubCategory = ({ param }: { param: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") || "recent";
  const pageParam = Number(searchParams.get("page")) || 1;

  const [sort, setSort] = useState(sortParam);
  const [page, setPage] = useState(pageParam);
  // Get initial sort state from query params
  const currentSort = searchParams.get("sort") || "recent";

  // Query category data
  const { data: subCategory, isLoading } = useQuery({
    queryKey: ["category", param],
    queryFn: ({ queryKey }) =>
      fetchSubCategory({ subcategory: queryKey[1] as string }),
    staleTime: 10 * 60 * 1000,
  });

  // Query products using selected sort
  const {
    data: products,
    isLoading: productLoading,
    error,
  } = useQuery({
    queryKey: ["category-product", subCategory?.slug, sort, page],
    queryFn: ({ queryKey }) =>
      fetchSubCategoryProducts({
        category: queryKey[1] as string,
        sort,
        page,
        limit,
      }),
    enabled: !!subCategory?.slug,
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
  const [showAll, setShowAll] = useState(false);
  const limit = 5;
  const subsubcategories = subCategory?.subSubCategories ?? [];
  const visibleItems = showAll
    ? subsubcategories
    : subsubcategories.slice(0, limit);

  return (
    <div className="w-full space-y-7 px-2">
      <div className="space-y-3 flex flex-col items-center justify-center">
        <h2 className="text-2xl capitalize font-serif font-light md:text-3xl lg:text-4xl">
          {param.charAt(0).toUpperCase() + param.slice(1)}
        </h2>
        <section
          className={cn(
            "grid grid-cols-2 sm:grid-cols-6 w-full justify-center items-center gap-2 sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto transition-all duration-500 ease-in-out",
            showAll
              ? "max-h-[1000px] opacity-100 flex-wrap"
              : "max-h-[600px] overflow-hidden"
          )}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[120px] md:h-[210px] w-full rounded-md"
                />
              ))
            : visibleItems.map((item) => (
                <HoverPrefetchLink
                  href={`/c/${item.subCategory.category?.slug}/${subCategory?.slug}/${item.slug}`}
                  className="w-full transition-transform duration-300 hover:underline"
                  key={item.id}
                >
                  <Image
                    src={
                      item.image ||
                      "https://placehold.co/200x200/e2e8f0/64748b?text=No+Image"
                    }
                    alt={item.name}
                    width={500}
                    height={500}
                    className="object-cover object-center rounded-lg w-full h-[120px] md:h-[210px]"
                  />
                  <h3 className="text-sm text-center font-medium font-sans capitalize mt-2">
                    {item.name}
                  </h3>
                </HoverPrefetchLink>
              ))}
        </section>

        {/* Show More / Show Less */}
        {subsubcategories.length > limit && (
          <div className="flex justify-center">
            <Button
              className="rounded-full p-3 bg-gray-300 text-base font-semibold font-sans"
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? `Show Less`
                : `Show More (${subsubcategories.length - limit})`}
            </Button>
          </div>
        )}
      </div>

      {/* Product Sorting */}
      {!productLoading && !error ? (
        <div className="flex justify-between items-center px-5 mx-auto">
          <div className="rounded-full border border-black p-2 flex gap-2 capitalize font-semibold font-sans text-sm">
            <SlidersHorizontal className="w-4 h-4" /> all filters
          </div>
          <Select onValueChange={handleSortChange} defaultValue={currentSort}>
            <SelectTrigger className="w-60 rounded-full border border-black capitalize font-medium font-sans md:block hidden">
              {/* <SelectValue placeholder="Sort By" /> */}
              Sort By: {separateStringByComma(sort)}
            </SelectTrigger>
            <SelectTrigger className="w-10 rounded-full border border-black capitalize font-medium font-sans md:hidden block">
              <ArrowUpDown className="inline w-5 h-5 mr-2" />
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
            <SelectTrigger className="w-60 rounded-full border border-black capitalize font-medium font-sans md:block hidden">
              {/* <SelectValue placeholder="Sort By" /> */}
              Sort By: {separateStringByComma(sort)}
            </SelectTrigger>
            <SelectTrigger className="w-10 rounded-full border border-black capitalize font-medium font-sans md:hidden block">
              <ArrowUpDown className="inline w-5 h-5 mr-2" />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-3">
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

export default SubCategory;
