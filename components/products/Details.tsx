"use client";

import { GET_SINGLE_PRODUCT } from "@/lib/query";
import { Product, productTags, SingleProduct } from "@/types";
import { useQuery } from "@apollo/client";
import ThumbnailGallery from "../ui/ThumbnailGallery";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { CheckIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/store/cart-store";
import RelatedProducts from "./RelatedProducts";
import RecentlyViewed from "./Recent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ProductDetails = ({ slug }: { slug: string }) => {
  const { data, loading, error } = useQuery<SingleProduct>(GET_SINGLE_PRODUCT, {
    variables: { slug: slug },
    notifyOnNetworkStatusChange: true,
  });

  const fallbackImages = [
    { url: "https://via.placeholder.com/200" },
    { url: "https://via.placeholder.com/200" },
    { url: "https://via.placeholder.com/200" },
  ];
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const handleSelectSize = (size: string) => {
    setSelectedSize((prevSize) => (prevSize === size ? null : size));
  };
  const handleSelect = (color: string) => {
    setSelectedColor(color);
  };

  function percentageDifference(num1: number | 0, num2: number | 0) {
    if (num1 === 0 && num2 === 0) {
      return 0; // No difference if both numbers are zero
    }

    // Use the absolute difference divided by the average of the two numbers
    const difference = Math.abs(num1 - num2);
    const average = (Math.abs(num1) + Math.abs(num2)) / 2;

    // Calculate percentage difference
    const percentage = (difference / average) * 100;

    return percentage.toFixed(0); // Returns the result rounded to 2 decimal places
  }

  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((state) => state.addToCart);
  const {
    price = 0,
    productName = "",
    images = [],
    id = "",
  } = data?.product || {};

  const cartData = useMemo(
    () => ({
      id: data?.product.id as string,
      name: data?.product.productName as string,
      image: data?.product.images[0].url as string,
      slug: data?.product.slug as string,
      price: data?.product.price as number,
      quantity: quantity as number,
      size: selectedSize as string,
      color: selectedColor as string,
    }),
    [
      quantity,
      selectedSize,
      selectedColor,
      price,
      productName,
      images,
      slug,
      id,
    ]
  );

  const image =
    data?.product.images && data.product.images.length > 0
      ? data.product.images
      : fallbackImages;

  return (
    <div>
      <Breadcrumb className="md:block hidden pb-5">
        <BreadcrumbList className="dark:text-white text-black">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/"
              className="text-xs md:text-sm font-medium font-sans"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/products"
              className=" text-xs md:text-sm font-medium font-sans"
            >
              Shop
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-medium font-sans line-clamp-1">
              {data?.product.category[0].productName}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-medium font-sans line-clamp-1">
              {data?.product.productName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* PRODUCT INAGES AND DETAILS */}
      <div className="mx-auto md:grid-cols-2 grid justify-between md:items-start items-center w-full gap-5 px-5">
        <ThumbnailGallery images={image} />
        <div className="flex flex-col space-y-5 items-start justify-start">
          <div className="grid gap-3 justify-start items-start">
            <h2 className="font-extrabold text-2xl md:text-3xl lg:text-4xl uppercase">
              {data?.product.productName}
            </h2>
            <div className="flex justify-start items-center gap-2">
              <span className="font-bold text-2xl lg:text-3xl text-start">
                {formatCurrencyValue(data?.product.price)}
              </span>
              {data?.product.discountedPrice && (
                <span className="font-light text-base  text-start text-black/30 dark:text-white/50 line-through decoration-black/30 dark:decoration-white/50">
                  {formatCurrencyValue(data?.product.discountedPrice)}
                </span>
              )}
              {data?.product.discountedPrice && (
                <span className="font-light text-base text-center text-white dark:text-black dark:bg-white bg-black rounded-lg p-1">
                  -
                  {percentageDifference(
                    // @ts-ignore
                    data?.product.price,
                    data?.product.discountedPrice
                  )}
                  %
                </span>
              )}
            </div>

            <p className="hidden md:line-clamp-3 lg:line-clamp-none">
              {data?.product.description}
            </p>
          </div>
          <Separator />

          {/* COLOR SELECTORS */}
          <div className="space-y-3">
            <span className="text-base font-medium capitalize text-start">
              select color
            </span>

            <div className="flex gap-3 items-start justify-start">
              {data?.product.colours.map((item) => (
                <div key={item.hex}>
                  <Checkbox
                    onClick={() => handleSelect(item.hex)}
                    style={{ backgroundColor: item.hex }}
                    id="colour"
                    name="colour"
                    value={item.hex}
                    checked={selectedColor === item.hex}
                    className={`w-10 h-10 rounded-full cursor-pointer border flex flex-col justify-center items-center ${
                      selectedColor === item.hex
                        ? "border-black"
                        : "border-gray-300"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
          <Separator />

          {/* SIZES */}
          <div className="flex gap-3 items-center justify-start">
            {data?.product.productSizes.map((size) => (
              <div
                key={size}
                onClick={() => handleSelectSize(size)} // Handles click for the div
                className={`px-4 py-2 rounded-lg cursor-pointer border text-center ${
                  selectedSize === size
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
              >
                {size.toUpperCase()}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex gap-4 mt-4 items-center justify-between w-full">
            <div className="flex items-center gap-3 border h-10 rounded-full">
              <button
                className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-l-full"
                onClick={
                  quantity > 1
                    ? () => setQuantity(quantity - 1)
                    : () => setQuantity(1)
                }
              >
                <MinusIcon className="w-4 h-4 " />
              </button>
              <span className="w-fit px-2">{quantity}</span>
              <button
                className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-r-full"
                onClick={
                  quantity < 10
                    ? () => setQuantity(quantity + 1)
                    : () => setQuantity(10)
                }
              >
                <PlusIcon className="w-4 h-4 " />
              </button>
            </div>

            <button
              className="flex items-center justify-center w-full h-10 text-lg border border-black text-white text-center bg-black dark:bg-white dark:text-black hover:bg-white hover:text-black rounded-full flex-grow transition-transform delay-150 duration-200 ease-in-out"
              onClick={() => {
                addToCart(cartData);
              }}
            >
              Add To Cart
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT FULL DETAILS AND REVIEWS */}
      <div className="mt-5 mx-auto max-w-screen-2xl px-5">
        <Tabs
          defaultValue="details"
          className="max-w-screen-2xl mx-auto w-full space-y-5"
        >
          <TabsList className="max-w-screen-2xl mx-auto w-full grid grid-cols-2 justify-between items-start bg-gray-200">
            <TabsTrigger
              value="details"
              className="text-lg font-medium capitalize text-center"
            >
              product details
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="text-lg font-medium capitalize text-center"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            {data?.product.productDetails.text}
          </TabsContent>
          <TabsContent value="reviews">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur
            eius facilis adipisci nostrum. Voluptatum doloremque itaque autem
            distinctio omnis natus suscipit ea. Iusto vitae sed beatae facilis!
            Laboriosam, quod eos?
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-5">
        <RelatedProducts
          tag={data?.product.productTag[0]}
          name={data?.product.productName as string}
        />
      </div>
      {/* <div className="mt-5">
        <RecentlyViewed />
      </div> */}
    </div>
  );
};

export default ProductDetails;
