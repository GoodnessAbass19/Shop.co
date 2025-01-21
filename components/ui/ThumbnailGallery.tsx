"use client";
import { images } from "@/types";
import Image from "next/image";
import React, { useState, useEffect } from "react";

const ThumbnailGallery = ({ images }: { images: images }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    // Set the first image as the initial selected image when the component mounts.
    setSelectedImageIndex(0);
  }, []);

  const selectImage = (index: any) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="flex flex-col-reverse md:flex-row flex-1 flex-grow-0 justify-start items-start gap-5">
      <div className="">
        <div className="grid md:grid-cols-1 grid-cols-4 gap-4 justify-center items-center">
          {images.map((image, index) => (
            <div
              key={index}
              className={`cursor-pointer max-w-[100px] md:max-w-[110px] rounded-2xl ${
                index === selectedImageIndex
                  ? "border-2 brightness-100 contrast-100"
                  : "brightness-50  hover:brightness-75"
              }`}
              onClick={() => selectImage(index)}
            >
              <Image
                width={500}
                height={500}
                src={image.url}
                alt={`Thumbnail ${index}`}
                loading="lazy"
                className="w-full md:rounded-lg hover:shadow-md transition duration-300 transform rounded-2xl"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:max-w-[480px] max-h-[400px] flex-grow order-1 md:order-2 aspect-square">
        {images.length > 0 && (
          <div>
            <Image
              width={450}
              height={450}
              priority
              src={images[selectedImageIndex].url}
              alt={`Selected Image ${selectedImageIndex}`}
              className="h-full w-full border-2 border-gray-200 object-cover object-center shadow-sm dark:border-gray-800 sm:rounded-2xl overflow-clip"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThumbnailGallery;
