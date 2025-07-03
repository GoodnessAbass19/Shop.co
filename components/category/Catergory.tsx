"use client";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Product } from "@prisma/client";

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

const fetchCategory = async ({
  category,
}: {
  category: string;
}): Promise<ProductCategory> => {
  const res = await fetch(`/api/categories/${category}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "Failed to fetch seller dashboard data."
    );
  }
  return res.json();
};

const Category = ({ param }: { param: string }) => {
  const { data: category, isLoading } = useQuery({
    queryKey: ["category", param],
    queryFn: ({ queryKey }) =>
      fetchCategory({ category: queryKey[1] as string }),
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });

  const [showAll, setShowAll] = useState(false);
  const limit = 5;

  const subcategories = category?.subCategories ?? []; // Adjust this based on your actual data structure
  const visibleItems = showAll ? subcategories : subcategories.slice(0, limit);

  if (isLoading) {
    return (
      <div className="flex !flex-row basis-11/12 flex-wrap gap-4 max-w-screen-lg mx-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[210px] w-full rounded-md basis-1/6" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-3 flex flex-col items-center justify-center">
        <section
          className={cn(
            "flex !flex-row w-full justify-center items-center gap-4 max-w-screen-lg mx-auto transition-all duration-500 ease-in-out",
            showAll
              ? "max-h-[1000px] opacity-100 !flex-wrap"
              : "max-h-[600px] overflow-hidden"
          )}
        >
          {visibleItems.map((item) => (
            <div className="w-full transition-transform duration-300 basis-1/6 hover:underline">
              <Image
                src={
                  item?.image ||
                  "https://placehold.co/200x200/e2e8f0/64748b?text=No+Image"
                }
                alt={item.name}
                width={500}
                height={500}
                className="object-cover object-center rounded-lg w-full h-[210px]"
              />
              <h3 className="text-sm text-center font-medium font-sans capitalize">
                {item.name}
              </h3>
            </div>
          ))}
        </section>
        {/* Toggle Button */}
        {subcategories.length > limit && (
          <div className="flex justify-center">
            <Button
              className="rounded-full p-3 bg-gray-300 text-base font-semibold font-sans"
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? `Show Less `
                : `Show More (${subcategories.length - limit})`}
            </Button>
          </div>
        )}
      </div>

      <div></div>
    </div>
  );
};

export default Category;
