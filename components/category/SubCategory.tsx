"use client";
import { cn, separateStringByComma, SORT_OPTIONS } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import Pagination from "../ui/Pagination";
import CategoryProductCard from "./CategoryProductCard";
import { ProductFromApi } from "../products/productCard";
import { SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
    <div className="w-full space-y-10">
      <div className="space-y-3 flex flex-col items-center justify-center">
        <section
          className={cn(
            "flex flex-row w-full justify-center items-center gap-4 max-w-screen-lg mx-auto transition-all duration-500 ease-in-out",
            showAll
              ? "max-h-[1000px] opacity-100 flex-wrap"
              : "max-h-[600px] overflow-hidden"
          )}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[210px] w-full rounded-md basis-1/6"
                />
              ))
            : visibleItems.map((item) => (
                <Link
                  href={`/c/${item.subCategory.category?.slug}/${subCategory?.slug}/${item.slug}`}
                  className="w-full transition-transform duration-300 basis-1/6 hover:underline"
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
                    className="object-cover object-center rounded-lg w-full h-[210px]"
                  />
                  <h3 className="text-sm text-center font-medium font-sans capitalize mt-2">
                    {item.name}
                  </h3>
                </Link>
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
          products?.products?.map((product: ProductFromApi) => (
            <CategoryProductCard product={product} key={product.id} />
          ))
        )}
      </div>
      <Pagination count={products?.total} page={products?.page} />
      {/* {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )} */}
    </div>
  );
};

export default SubCategory;
