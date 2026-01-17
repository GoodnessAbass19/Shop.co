"use client";

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, FreeMode } from "swiper/modules";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import useSwiperRef from "@/hooks/useSwiperRef";

const RecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    updateRecentlyViewed();
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  const updateRecentlyViewed = () => {
    try {
      const currentPage = window.location.href; // Get the current page URL
      const maxPages = 20; // Maximum number of pages to track

      let recentlyViewed = JSON.parse(
        localStorage.getItem("rvc_product") || "[]"
      );

      // Remove the current page if it already exists
      recentlyViewed = recentlyViewed.filter(
        (page: string) => page !== currentPage
      );

      // Add the current page to the beginning
      recentlyViewed.unshift(currentPage);

      // Trim the list to the max limit
      if (recentlyViewed.length > maxPages) {
        recentlyViewed = recentlyViewed.slice(0, maxPages);
      }

      // Save back to localStorage
      localStorage.setItem("rvc_product", JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error("Failed to update recently viewed:", error);
    }
  };

  const getRecentlyViewed = () => {
    try {
      const currentPage = window.location.href; // Get the current page URL
      let recentlyViewed = JSON.parse(
        localStorage.getItem("rvc_product") || "[]"
      );

      // Exclude the current page
      return recentlyViewed
        .slice(0, 10)
        .filter(
          (page: string) => page !== currentPage && page.includes("/product")
        );
    } catch (error) {
      console.error("Failed to retrieve recently viewed:", error);
      return [];
    }
  };

  const [nextEl, nextElRef] = useSwiperRef<HTMLButtonElement>();
  const [prevEl, prevElRef] = useSwiperRef<HTMLButtonElement>();

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <div className="max-w-screen-2xl mx-auto py-5 px-3 space-y-5">
      <h3 className="font-medium text-lg text-black md:text-lg capitalize">
        Recently Viewed
      </h3>
      <div className="relative flex items-center">
        {/* Previous Button */}
        <button
          ref={prevElRef}
          className="absolute left-5 z-10 rounded-full border-none dark:bg-white bg-black shadow-lg p-2 outline-none transform -translate-x-1/2"
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
          {recentlyViewed.map((page, index) => (
            <SwiperSlide key={index}>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Fugit,
              nostrum cupiditate! Et amet inventore voluptate quod soluta autem
              veniam enim necessitatibus vitae saepe corrupti accusamus,
              blanditiis nisi minima! Quos, id!
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

export default RecentlyViewed;
