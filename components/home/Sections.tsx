"use client";

import ProductCard from "../products/productCard";
import { Navigation, FreeMode } from "swiper/modules";
import useSwiperRef from "@/hooks/useSwiperRef";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { Product, ProductVariant } from "@prisma/client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || "Failed to fetch data.");
    error.status = res.status;
    throw error;
  }
  return data;
};

type ProductData = Product & {
  variants: ProductVariant[];
  images: { url: string }[];
};

const Sections = ({
  title,
  href,
  url,
}: {
  title: string;
  href: string;
  url: string;
}) => {
  const { data, error, isLoading } = useSWR(url, fetcher);
  const products: ProductData[] | null = data?.products || null;

  const [nextEl, nextElRef] = useSwiperRef<HTMLButtonElement>();
  const [prevEl, prevElRef] = useSwiperRef<HTMLButtonElement>();

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto py-5 px-2 space-y-5">
        <h2 className="capitalize text-start text-xl font-extrabold">
          {title}
        </h2>
        <div className="grid grid-cols-5 justify-center items-center w-full h-full mx-auto gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse bg-gray-200 rounded-md w-full h-[250px]"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-screen-xl mx-auto py-5 px-2 space-y-5 mt-5"
    >
      <div className="flex justify-between items-end mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-start text-xl md:text-2xl font-extrabold capitalize">
            {title}
          </h2>
          {/* <h2 className="text-[#0d131b] dark:text-white tracking-tight text-[28px] font-bold leading-tight capitalize">
            {title}
          </h2> */}
        </div>
        <Link
          className="text-[#136dec] font-bold text-sm hover:underline flex items-center gap-1"
          href={`/${href}`}
        >
          View All Deals <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative flex items-center">
        {/* Previous Button */}
        <button
          ref={prevElRef}
          className="absolute left-5 z-10 rounded-full border-none dark:bg-white bg-black shadow-lg p-2 outline-none  transform -translate-x-1/2"
        >
          <ArrowLeftIcon className="h-4 w-4 dark:text-gray-600 text-white" />
        </button>

        <Swiper
          className="w-full h-full"
          breakpoints={{
            0: {
              slidesPerView: 1.5,
              spaceBetween: 8,
            },
            540: {
              slidesPerView: 3,
              spaceBetween: 8,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 8,
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 8,
            },
          }}
          modules={[FreeMode, Navigation]}
          freeMode={true}
          navigation={{
            prevEl,
            nextEl,
          }}
        >
          {products?.map((product, index) => (
            <SwiperSlide key={index}>
              <ProductCard item={product} loading={isLoading} />
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

      {/* {!isLoading && (
        <div className="flex justify-center items-center w-[200px] mx-auto">
          <HoverPrefetchLink
            href={`/${href}`}
            className="text-sm font-medium capitalize text-center rounded-full p-2 border border-black/50 w-full"
          >
            view all
          </HoverPrefetchLink>
        </div>
      )} */}
    </motion.div>
  );
};

export default Sections;
