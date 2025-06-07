"use client";

import { GET_PRODUCTS_BY_TAGS } from "@/lib/query";
import { ProductData, productTags } from "@/types";
import { useQuery } from "@apollo/client";
import ProductCard from "../products/productCard";
import { Button } from "../ui/button";
import Link from "next/link";
import { Navigation, FreeMode } from "swiper/modules";
import useSwiperRef from "@/Hooks/useSwiperRef";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";

const Sections = ({
  title,
  tag,
  first,
  href,
}: {
  title: string;
  tag: any;
  first: number;
  href: string;
}) => {
  const { data, loading } = useQuery<ProductData>(GET_PRODUCTS_BY_TAGS, {
    variables: { tag: tag, first: first },
    notifyOnNetworkStatusChange: true,
  });

  const [nextEl, nextElRef] = useSwiperRef<HTMLButtonElement>();
  const [prevEl, prevElRef] = useSwiperRef<HTMLButtonElement>();

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto py-5 px-2 space-y-5">
        <h2 className="uppercase text-center text-4xl font-extrabold">
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-screen-xl mx-auto py-5 px-2 space-y-5 mt-5"
    >
      <h2 className="uppercase text-center text-4xl font-semibold">{title}</h2>
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
              spaceBetween: 5,
            },
            540: {
              slidesPerView: 3,
              spaceBetween: 5,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 5,
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 5,
            },
          }}
          modules={[FreeMode, Navigation]}
          freeMode={true}
          navigation={{
            prevEl,
            nextEl,
          }}
        >
          {data?.products.map((item, index) => (
            <SwiperSlide key={index}>
              <ProductCard item={item} loading={loading} />
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

      {!loading && (
        <div className="flex justify-center items-center w-[200px] mx-auto">
          <Link
            href={`/${href}`}
            className="text-sm font-medium capitalize text-center rounded-full p-2 border border-black/50 w-full"
          >
            view all
          </Link>
        </div>
      )}
    </motion.div>
  );
};

export default Sections;
