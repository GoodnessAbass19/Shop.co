"use client";
import React, { useState } from "react";
import { ArrowRight, ChevronRight, MenuIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
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

const fetchCategories = async (): Promise<ProductCategory[]> => {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "Failed to fetch seller dashboard data."
    );
  }
  return res.json();
};

const CategoryMenu = () => {
  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });
  const [activeCategory, setActiveCategory] = useState(categories?.[0] || null);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          className="focus:outline-none"
          disabled={isLoading}
        >
          <button className="hover:text-gray-700 text-black font-sans hover:bg-gray-300 rounded-full p-2 text-sm font-semibold capitalize flex items-center justify-start gap-x-1 transition-colors">
            <MenuIcon className="h-5 w-5" /> categories
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-full h-[60vh] max-w-screen-[800px] bg-white shadow-lg rounded-md p-4 grid-cols-4 grid mt-2.5"
          align="start"
        >
          <div className="col-span-1 border-r overflow-y-scroll">
            {categories?.map((category) => (
              <DropdownMenuItem
                key={category.name}
                className={cn(
                  "py-2 px-1.5 rounded-md cursor-pointer hover:bg-muted text-sm font-normal font-sans capitalize flex justify-between items-center",
                  category.name === activeCategory?.name &&
                    "bg-muted font-semibold"
                )}
                onMouseEnter={() => setActiveCategory(category)}
              >
                {category.name}
                <ChevronRight className="w-5 h-5" />
              </DropdownMenuItem>
            ))}
          </div>

          {/* Subcategory Grid */}
          <div className="col-span-3 pl-4">
            <div>
              <Link
                href={""}
                className="flex gap-2 justify-start items-center font-semibold font-serif text-base capitalize hover:gap-2.5 transition-transform duration-500 ease-in-out"
              >
                all {activeCategory?.name} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2.5 overflow-y-scroll justify-between items-center">
              {(activeCategory?.subCategories?.length ?? 0) > 0 ? (
                activeCategory?.subCategories?.map((item) => (
                  <div
                    key={item?.name}
                    className="flex flex-col items-center text-center rounded-md p-2 hover:shadow-2xl col-span-1"
                  >
                    {isLoading ? (
                      <div className="w-20 h-20 rounded-md overflow-hidden animate-pulse"></div>
                    ) : (
                      <Image
                        src={
                          item.image ||
                          "https://placehold.co/100x100/e2e8f0/64748b?text=No+Image"
                        }
                        alt={item.name}
                        width={500}
                        height={500}
                        className="w-[150px] h-[150px] rounded-md overflow-hidden mb-1"
                      />
                    )}

                    <span className="text-sm font-semibold font-sans">
                      {item?.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-3 pl-4 text-sm text-muted-foreground">
                  No subcategories
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CategoryMenu;
