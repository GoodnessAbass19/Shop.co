"use client";

import useSwiperRef from "@/Hooks/useSwiperRef";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FreeMode, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

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

const Categories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 5 minutes
  });

  const [nextEl, nextElRef] = useSwiperRef<HTMLButtonElement>();
  const [prevEl, prevElRef] = useSwiperRef<HTMLButtonElement>();

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto py-5 px-2 space-y-5 mt-5">
        <h2 className="text-start text-xl font-extrabold">Shop by Category</h2>
        <div className="grid grid-cols-6 justify-center items-center w-full h-full mx-auto gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse bg-gray-200 rounded-md w-full h-[150px]"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto py-5 px-2 space-y-5 mt-5">
      <h2 className="text-start text-xl md:text-2xl font-extrabold">
        Shop by Category
      </h2>

      <div className="relative flex items-center">
        <button
          ref={prevElRef}
          className="absolute left-5 z-10 rounded-full border-none dark:bg-white bg-black shadow-lg p-2 outline-none  transform -translate-x-1/2"
        >
          <ArrowLeftIcon className="h-4 w-4 dark:text-gray-600 text-white" />
        </button>

        <Swiper
          className="w-full"
          breakpoints={{
            0: {
              slidesPerView: 3,
              spaceBetween: 5,
            },
            540: {
              slidesPerView: 4,
              spaceBetween: 5,
            },
            1024: {
              slidesPerView: 6,
              spaceBetween: 5,
            },
            // 1280: {
            //   slidesPerView: 7,
            //   spaceBetween: 8,
            // },
          }}
          modules={[FreeMode, Navigation]}
          freeMode={true}
          navigation={{
            prevEl,
            nextEl,
          }}
        >
          {categories?.map((category, index) => (
            <SwiperSlide key={index} className="w-full">
              <Link
                href={`/c/${category.slug}`}
                aria-label={`View ${category.name} category`}
                className="h-[150px] group flex flex-col gap-2 rounded-xl border border-[#cfd9e7] dark:border-gray-700 bg-white dark:bg-surface-dark items-stretch hover:shadow-md hover:border-primary transition-all duration-300 cursor-pointer overflow-hidden p-2"
              >
                <div className="w-full h-24 overflow-hidden rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <Image
                    src={category.image || "/Images/placeholder.png"}
                    alt={category.name}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={false}
                  />
                </div>

                <div className="px-1 mt-1 flex-1 flex items-center justify-center">
                  <h3 className="text-center text-[#0d131b] dark:text-white text-sm font-semibold leading-tight truncate">
                    {category.name}
                  </h3>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Next Button */}

        <button
          ref={nextElRef}
          className="absolute right-5 z-10 rounded-full border-none dark:bg-white bg-black shadow-lg p-2 outline-none transform translate-x-1/2"
        >
          <ArrowRightIcon className="h-4 w-4 dark:text-gray-600 text-white" />
        </button>
      </div>
    </div>
  );
};

export default Categories;
