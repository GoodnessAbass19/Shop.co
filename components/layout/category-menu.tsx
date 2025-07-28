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
import { useRouter } from "next/navigation";
import { HoverPrefetchLink } from "@/lib/HoverLink";

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
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
  });
  const [activeCategory, setActiveCategory] = useState<
    ProductCategory | undefined
  >(undefined);

  React.useEffect(() => {
    if (categories && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);
  const router = useRouter();

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
          className="w-full !h-[75vh] !max-w-screen-[700px] bg-white shadow-lg rounded-md p-4 grid-cols-4 grid mt-2.5"
          align="start"
        >
          <div className="col-span-1 border-r overflow-y-scroll">
            {categories?.map((category) => (
              <div
                key={category.name}
                className={cn(
                  "py-2 px-1.5 rounded-md cursor-pointer hover:bg-muted text-base font-semibold font-sans capitalize flex justify-between items-center",
                  category.name === activeCategory?.name &&
                    "bg-muted font-semibold"
                )}
                onMouseEnter={() => setActiveCategory(category)}
              >
                {category.name}
                <ChevronRight className="w-5 h-5" />
              </div>
            ))}
          </div>

          {/* Subcategory Grid */}
          <div className="col-span-3 pl-4 w-full">
            <HoverPrefetchLink
              href={`/c/${activeCategory?.slug}`}
              className="flex gap-2 justify-start items-center font-semibold font-serif text-base capitalize hover:gap-2.5 transition-transform duration-500 ease-in-out"
            >
              all {activeCategory?.name} <ArrowRight className="w-5 h-5" />
            </HoverPrefetchLink>

            <div className="grid grid-cols-3 gap-2.5 overflow-y-scroll justify-between items-stretch w-full">
              {isLoading ? (
                <div>
                  {Array.from({ length: 5 }).map((item, idx) => (
                    <div
                      key={idx}
                      className="w-[200px] h-[200px] rounded-md overflow-hidden animate-pulse col-span-1"
                    ></div>
                  ))}
                </div>
              ) : (activeCategory?.subCategories?.length ?? 0) > 0 ? (
                activeCategory?.subCategories?.map((item) => (
                  <div key={item?.name}>
                    {isLoading ? (
                      <div className="w-[200px] h-[200px] rounded-md overflow-hidden animate-pulse"></div>
                    ) : (
                      <HoverPrefetchLink
                        href={`/c/${activeCategory?.slug}/${item.slug}`}
                        className="text-center rounded-md p-1 hover:shadow-md flex flex-col items-center justify-center gap-1 w-full overflow-hidden"
                      >
                        <Image
                          src={
                            item.image ||
                            "https://placehold.co/200x200/e2e8f0/64748b?text=No+Image"
                          }
                          alt={item.name}
                          width={500}
                          height={500}
                          loading={"lazy"}
                          className="max-w-[200px] max-h-[200px] w-full h-full object-cover object-center rounded-lg overflow-hidden"
                        />
                        <span className="text-sm font-semibold font-sans line-clamp-1">
                          {item?.name}
                        </span>
                      </HoverPrefetchLink>
                    )}
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
