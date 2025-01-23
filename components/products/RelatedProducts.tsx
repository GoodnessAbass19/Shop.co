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

const RelatedProducts = ({ name, tag }: { name: string; tag: any }) => {
  const { data, loading, error } = useQuery<ProductData>(GET_RELATED_PRODUCTS, {
    variables: { tag: tag, name: name },
    notifyOnNetworkStatusChange: true,
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return (
    <div className="max-w-screen-2xl mx-auto py-5 px-3 space-y-5">
      <h2 className="text-start text-2xl font-medium">You may also like</h2>
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
        // navigation={true}
      >
        {data?.products.map((item) => (
          <SwiperSlide
            key={item.id}
            // className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 justify-between items-stretch"
          >
            <ProductCard item={item} loading={loading} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default RelatedProducts;
