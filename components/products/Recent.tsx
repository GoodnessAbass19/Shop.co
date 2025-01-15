// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/scrollbar";

// import required modules
import { Scrollbar, FreeMode } from "swiper/modules";
import RecentProduct from "./RecentProductCard";

const RecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    updateRecentlyViewed();
    const viewed = getRecentlyViewed();
    setRecentlyViewed(viewed);
  }, []);

  const updateRecentlyViewed = () => {
    const currentPage = window.location.href; // Get the current page URL
    const maxPages = 20; // Maximum number of pages to track

    // Retrieve the existing list of recently viewed pages from localStorage
    let recentlyViewed =
      JSON.parse(localStorage.getItem("recentlyViewed")) || [];

    // Remove the current page if it already exists in the list to avoid duplicates
    recentlyViewed = recentlyViewed.filter((page) => page !== currentPage);

    // Add the current page to the beginning of the list
    recentlyViewed.unshift(currentPage);

    // Trim the list to the maximum number of pages
    if (recentlyViewed.length > maxPages) {
      recentlyViewed = recentlyViewed.slice(0, maxPages);
    }

    // Save the updated list back to localStorage
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
  };

  const getRecentlyViewed = () => {
    const currentPage = window.location.href; // Get the current page URL
    let recentlyViewed =
      JSON.parse(localStorage.getItem("recentlyViewed")) || [];

    // Remove the current page from the list
    recentlyViewed = recentlyViewed.filter((page) => page !== currentPage);

    return recentlyViewed;
  };

  return (
    <div className="space-y-5">
      <div className="bg-white text-start w-full p-1.5 shadow-sm shadow-black/10 rounded-sm">
        <h3 className="font-medium text-base text-black md:text-lg capitalize">
          Recently Viewed
        </h3>
      </div>
      <div className="hidden lg:grid grid-cols-5 justify-between items-start gap-x-5">
        {recentlyViewed.slice(0, 5).map((page, index) => (
          <div className="col-span-1">
            <RecentProduct url={page} key={index} />
          </div>
        ))}
      </div>
      <div className="lg:hidden block space-y-7 pl-2">
        <Swiper
          breakpoints={{
            0: {
              slidesPerView: 1.5,
              spaceBetween: 5,
            },
            540: {
              slidesPerView: 2.1,
              spaceBetween: 5,
            },
          }}
          // slidesPerView={1.2}
          // slidesPerGroup={2}
          // spaceBetween={10}
          modules={[FreeMode, Scrollbar]}
          freeMode={true}
          scrollbar={{
            hide: false,
          }}
        >
          {recentlyViewed.slice(0, 5).map((page, index) => (
            <SwiperSlide key={index}>
              <RecentProduct url={page} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default RecentlyViewed;
