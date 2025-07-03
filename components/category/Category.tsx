"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn, SORT_OPTIONS } from "@/lib/utils";
import { Product } from "@prisma/client";

// Types
interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  product: Product[];
  subCategories: SubCategory[];
}

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
}

// Fetch category details
const fetchCategory = async ({
  category,
}: {
  category: string;
}): Promise<ProductCategory> => {
  const res = await fetch(`/api/categories/${category}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch category data.");
  }
  return res.json();
};

// Fetch sorted products in the category
const fetchCategoryProducts = async ({
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
    `/api/categories/${category}/products?sort=${sort}&page=${page}&limit=${limit}`
  );
  const data = await res.json();
  return data.products;
};

const Category = ({ param }: { param: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") || "recent";
  const pageParam = Number(searchParams.get("page")) || 1;

  const [sort, setSort] = useState(sortParam);
  const [page, setPage] = useState(pageParam);
  // Get initial sort state from query params
  const currentSort = searchParams.get("sort") || "recent";
  const [value, setValue] = useState(currentSort);

  // Query category data
  const { data: category, isLoading } = useQuery({
    queryKey: ["category", param],
    queryFn: ({ queryKey }) =>
      fetchCategory({ category: queryKey[1] as string }),
    staleTime: 5 * 60 * 1000,
  });

  // Query products using selected sort
  const { data: products, isLoading: productLoading } = useQuery({
    queryKey: ["category-product", category?.slug, sort, page],
    queryFn: ({ queryKey }) =>
      fetchCategoryProducts({
        category: queryKey[1] as string,
        sort,
        page,
        limit,
      }),
    enabled: !!category?.slug,
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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
    setPage(newPage);
  };

  const product = products?.products || [];
  const totalPages = products?.totalPages || 1;

  // Subcategories with toggle logic
  const [showAll, setShowAll] = useState(false);
  const limit = 5;
  const subcategories = category?.subCategories ?? [];
  const visibleItems = showAll ? subcategories : subcategories.slice(0, limit);

  // Handle sorting dropdown change
  // const handleChange = (newValue: string) => {
  //   setValue(newValue);
  //   const params = new URLSearchParams(searchParams);
  //   params.set("sort", newValue);
  //   router.push(`${pathname}?${params.toString()}`);
  // };

  return (
    <div className="w-full space-y-10">
      {/* Subcategories Preview */}
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
                <div
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
                </div>
              ))}
        </section>

        {/* Show More / Show Less */}
        {subcategories.length > limit && (
          <div className="flex justify-center">
            <Button
              className="rounded-full p-3 bg-gray-300 text-base font-semibold font-sans"
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? `Show Less`
                : `Show More (${subcategories.length - limit})`}
            </Button>
          </div>
        )}
      </div>

      {/* Product Sorting */}
      <div className="flex justify-end">
        <Select onValueChange={handleSortChange} defaultValue={currentSort}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Sort By" />
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

      {/* Product List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {productLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-md" />
          ))
        ) : products?.length === 0 ? (
          <p className="text-center col-span-full text-muted-foreground">
            No products found in this category.
          </p>
        ) : (
          products?.map((product: Product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white"
            >
              <Image
                src={product?.images?.[0] || "https://placehold.co/300x300"}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-[200px] object-cover rounded-md"
              />
              <div className="mt-3">
                <h4 className="text-md font-semibold">{product.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {/* ₦{product?.price.toLocaleString()} */}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
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
      )}
    </div>
  );
};

export default Category;
