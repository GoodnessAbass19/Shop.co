"use client";

import { useToast } from "@/Hooks/use-toast";
import { cn } from "@/lib/utils";
import { images as ImagesType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Heart, Loader2, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination, Scrollbar } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";

import "swiper/css";
import "swiper/css/scrollbar";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import WishlistButton from "./wishlistButton";

const checkWishlistStatus = async (productId: string) => {
  const res = await fetch(`/api/wishlist/status?productId=${productId}`);
  if (!res.ok) {
    if (res.status === 401) return { isWishlisted: false };
    throw new Error((await res.json())?.error);
  }
  return res.json();
};

const addProductToWishlist = async (productId: string) => {
  const res = await fetch("/api/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) throw new Error((await res.json())?.error);
  return res.json();
};

const removeProductFromWishlist = async (productId: string) => {
  const res = await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json())?.error);
  return res.json();
};

const ThumbnailGallery = ({
  images,
  id,
  name,
}: {
  images: ImagesType;
  id: string;
  name: string;
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistStatus, isLoading: isCheckingWishlist } = useQuery({
    queryKey: ["wishlistStatus", id],
    queryFn: () => checkWishlistStatus(id),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const isWishlisted = wishlistStatus?.isWishlisted ?? false;

  const addMutation = useMutation({
    mutationFn: addProductToWishlist,
    onSuccess: () => {
      toast({ title: "Added to Wishlist" });
      queryClient.invalidateQueries({ queryKey: ["wishlistStatus", id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeProductFromWishlist,
    onSuccess: () => {
      toast({ title: "Removed from Wishlist" });
      queryClient.invalidateQueries({ queryKey: ["wishlistStatus", id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const isUpdating =
    isCheckingWishlist || addMutation.isPending || removeMutation.isPending;

  const handleWishlistToggle = useCallback(() => {
    if (isUpdating) return;
    isWishlisted ? removeMutation.mutate(id) : addMutation.mutate(id);
  }, [isUpdating, isWishlisted]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsZoomOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <div className="sm:flex flex-col-reverse md:flex-row gap-3 justify-start items-start hidden">
        {/* Thumbnails */}
        <Swiper
          scrollbar={{
            draggable: true,
            snapOnRelease: true,
            dragSize: 10,
            hide: true,
          }}
          spaceBetween={10}
          freeMode
          slidesPerView={5}
          modules={[Scrollbar, FreeMode]}
          // direction="horizontal"
          breakpoints={{
            768: { direction: "vertical", slidesPerView: 6.5 },
          }}
          className="md:h-[480px]"
        >
          {images.map((image, index) => (
            <SwiperSlide
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "cursor-pointer rounded-xl overflow-hidden",
                index === selectedImageIndex
                  ? "ring-2 ring-primary brightness-100"
                  : "brightness-50 hover:brightness-75 transition"
              )}
            >
              <Image
                src={image.url}
                width={500}
                height={500}
                alt=""
                className="md:rounded-lg hover:shadow-md transition duration-300 transform rounded-xl object-cover w-full h-full"
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Main Image */}
        <div
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in"
          onClick={() => setIsZoomOpen(true)}
        >
          <Image
            src={images[selectedImageIndex].url}
            width={1000}
            height={1000}
            alt="Selected"
            className="object-cover w-full h-full transform transition-transform duration-500"
            priority
          />

          {/* Wishlist Button */}

          <WishlistButton
            name={name}
            productId={id}
            className="absolute top-3 right-3 rounded-full bg-white/80 backdrop-blur-sm shadow-md w-7 h-7 justify-center items-center"
          />
        </div>
      </div>

      <div className="block sm:hidden">
        <Swiper
          pagination={true}
          modules={[Pagination]}
          className="block sm:hidden h-[350px]"
        >
          {images.map((image, index) => (
            <SwiperSlide
              key={index}
              onClick={() => {
                setSelectedImageIndex(index), setIsZoomOpen(true);
              }}
              className="cursor-pointer rounded-xl overflow-hidden p-2 h-full w-full"
            >
              <Image
                src={image.url}
                width={500}
                height={500}
                alt=""
                className="md:rounded-lg hover:shadow-md transition duration-300 transform rounded-xl object-cover w-full h-full"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ZOOM MODAL */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="relative w-[92vw] max-w-4xl rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedImageIndex].url}
                width={2000}
                height={2000}
                alt="Zoomed"
                className="object-contain w-full h-full"
              />

              {/* Close Button */}
              <button
                onClick={() => setIsZoomOpen(false)}
                className="absolute top-4 right-4 bg-white/80 rounded-full p-2 shadow-md"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ThumbnailGallery;
