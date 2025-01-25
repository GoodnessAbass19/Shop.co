"use client";

import { GET_RELATED_PRODUCTS } from "@/lib/query";
import { ProductData } from "@/types";
import { useQuery } from "@apollo/client";
import ProductCard from "./productCard";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

// import required modules
import { Navigation, FreeMode } from "swiper/modules";
import useSwiperRef from "@/Hooks/useSwiperRef";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

const RelatedProducts = ({ name, tag }: { name: string; tag: any }) => {
  const { data, loading, error } = useQuery<ProductData>(GET_RELATED_PRODUCTS, {
    variables: { tag: tag, name: name },
    notifyOnNetworkStatusChange: true,
  });

  const [nextEl, nextElRef] = useSwiperRef<HTMLButtonElement>();
  const [prevEl, prevElRef] = useSwiperRef<HTMLButtonElement>();

  return (
    <div className="max-w-screen-2xl mx-auto py-5 px-3 space-y-5">
      <h2 className="text-start text-2xl font-medium">You may also like</h2>
      <div className="relative flex items-center">
        {/* Previous Button */}
        <button
          ref={prevElRef}
          className="absolute left-0 z-10 rounded-full border-none dark:bg-white bg-black/50 shadow-lg p-2 outline-none  transform -translate-x-1/2"
        >
          <ArrowLeftIcon className="h-4 w-4 dark:text-gray-600 text-white" />
        </button>

        <Swiper
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
          {data?.products.map((item) => (
            <SwiperSlide key={item.id}>
              <ProductCard item={item} loading={loading} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Next Button */}
        <button
          ref={nextElRef}
          className="absolute right-0 z-10 rounded-full border-none dark:bg-white bg-black/50 shadow-lg p-2 outline-none transform translate-x-1/2"
        >
          <ArrowRightIcon className="h-4 w-4 dark:text-gray-600 text-white" />
        </button>
      </div>
    </div>
  );
};

export default RelatedProducts;
