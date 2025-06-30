"use client";

import ThumbnailGallery from "../ui/ThumbnailGallery";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { CheckIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useMemo, useState, useCallback } from "react";
// import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/store/cart-store";
// import RelatedProducts from "./RelatedProducts";
import RecentlyViewed from "./Recent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AddToCartButton } from "../layout/Toast";
import { toast } from "react-toastify";
// import { createCartItem } from "@/lib/actions";
import useSWR from "swr";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getFirstName, getInitials, getLastName } from "@/lib/utils";

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

const ProductDetails = ({ slug }: { slug: string }) => {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products/${slug}`,
    fetcher
  );
  const queryClient = useQueryClient();
  const router = useRouter();
  const fallbackImages = [
    { url: "https://via.placeholder.com/200" },
    { url: "https://via.placeholder.com/200" },
    { url: "https://via.placeholder.com/200" },
  ];
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<
    (typeof data.product.variants)[0] | null
  >(null);

  const addToCartMutation = useMutation({
    mutationFn: async ({
      productVariantId,
      quantity,
    }: {
      productVariantId: string;
      quantity: number;
    }) => {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productVariantId, quantity }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add item to cart.");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the 'cart' query so it refetches next time it's accessed (e.g., if user goes to cart page)
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item added to cart successfully!");
    },
    onError: (mutationError: Error) => {
      // alert(`Error adding to cart: ${mutationError.message}`);
      toast.error(`Error adding to cart: ${mutationError.message}`);
      router.push(`/sign-in?redirectUrl=/products/${slug}`);
    },
  });
  // Derive unique sizes and colors from all variants
  // Derive ALL unique sizes from product variants
  const availableSizes = useMemo(() => {
    if (!data?.product) return [];
    const sizes = new Set<string>();
    data?.product.variants.forEach((v: { size: string }) => {
      if (v.size) sizes.add(v.size);
    });
    return Array.from(sizes).sort();
  }, [data?.product]);

  // Derive ALL unique colors from data?.product variants
  const availableColors = useMemo(() => {
    if (!data?.product) return [];
    const colors = new Set<string>();
    data?.product.variants.forEach((v: { color: string }) => {
      if (v.color) colors.add(v.color);
    });
    return Array.from(colors).sort();
  }, [data?.product]);

  // Helper: Get sizes that are actually available given the current color selection
  const getAvailableSizesForColor = useCallback(
    (color: string | null) => {
      if (!data?.product) return new Set<string>();
      if (!color) {
        // If no color selected, all sizes that have *any* variant are technically available
        const sizesWithAnyVariant = new Set<string>();
        data?.product.variants.forEach((v: { size: string; stock: number }) => {
          if (v.size && v.stock > 0) sizesWithAnyVariant.add(v.size);
        });
        return sizesWithAnyVariant;
      }
      const sizes = new Set<string>();
      data?.product.variants.forEach(
        (v: { color: string; size: string; stock: number }) => {
          if (v.color === color && v.size && v.stock > 0) {
            sizes.add(v.size);
          }
        }
      );
      return sizes;
    },
    [data?.product]
  );

  // Helper: Get colors that are actually available given the current size selection
  const getAvailableColorsForSize = useCallback(
    (size: string | null) => {
      if (!data?.product) return new Set<string>();
      if (!size) {
        // If no size selected, all colors that have *any* variant are technically available
        const colorsWithAnyVariant = new Set<string>();
        data?.product.variants.forEach(
          (v: { color: string; stock: number }) => {
            if (v.color && v.stock > 0) colorsWithAnyVariant.add(v.color);
          }
        );
        return colorsWithAnyVariant;
      }
      const colors = new Set<string>();
      data?.product.variants.forEach(
        (v: { size: string; color: string; stock: number }) => {
          if (v.size === size && v.color && v.stock > 0) {
            colors.add(v.color);
          }
        }
      );
      return colors;
    },
    [data?.product]
  );

  // Effect to find the matching variant whenever selections change
  useEffect(() => {
    if (!data?.product) {
      setSelectedVariant(null);
      setQuantity(1);
      return;
    }

    const foundVariant = data?.product.variants.find(
      (v: { size: string | null; color: string | null }) =>
        v.size === selectedSize && v.color === selectedColor
    );
    setSelectedVariant(foundVariant || null);

    // Reset quantity if selected variant changes or becomes unavailable
    if (foundVariant && foundVariant.stock > 0) {
      setQuantity(1); // Default to 1
    } else {
      setQuantity(0); // Cannot purchase if no variant or out of stock
    }
  }, [data?.product, selectedSize, selectedColor]);

  // Handle case where selecting one attribute makes the other attribute's current selection invalid
  // This ensures a valid combination is always sought or resets a non-viable selection.
  useEffect(() => {
    if (!data?.product) return;

    // After selectedSize changes, if selectedColor is no longer valid for the new size, reset selectedColor
    if (selectedSize !== null && selectedColor !== null) {
      const colorsViableForNewSize = getAvailableColorsForSize(selectedSize);
      if (!colorsViableForNewSize.has(selectedColor)) {
        setSelectedColor(null); // Reset color if it's no longer viable
      }
    }

    // After selectedColor changes, if selectedSize is no longer valid for the new color, reset selectedSize
    if (selectedColor !== null && selectedSize !== null) {
      const sizesViableForNewColor = getAvailableSizesForColor(selectedColor);
      if (!sizesViableForNewColor.has(selectedSize)) {
        setSelectedSize(null); // Reset size if it's no longer viable
      }
    }
  }, [
    selectedSize,
    selectedColor,
    data?.product,
    getAvailableColorsForSize,
    getAvailableSizesForColor,
  ]);

  // Effect to find the matching variant whenever selections change
  useEffect(() => {
    if (!data?.product) {
      setSelectedVariant(null);
      setQuantity(0);
      return;
    }

    const foundVariant = data?.product.variants.find(
      (v: { size: string | null; color: string | null }) =>
        v.size === selectedSize && v.color === selectedColor
    );
    setSelectedVariant(foundVariant || null);

    // Reset quantity if selected variant changes or becomes unavailable
    if (foundVariant && foundVariant.stock > 0) {
      setQuantity(1); // Default to 1
    } else {
      setQuantity(0); // Cannot purchase if no variant or out of stock
    }
  }, [data?.product, selectedSize, selectedColor]);

  const [quantity, setQuantity] = useState(1);
  // const items = useCartStore((state) => state.items)
  //   .filter((item) => item.id === data?.product.id)
  //   .map((item) => {
  //     return item;
  //   });
  // const updateItemQuantity = useCartStore((state) => state.updateQuantity);

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
      price:
        (data?.product.discountedPrice as number) ||
        (data?.product.price as number),
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

  const handleAddToCart = () => {
    if (!selectedVariant) {
      alert("Please select a size and color combination.");
      return;
    }

    if (selectedVariant.stock === 0) {
      alert("This variant is currently out of stock.");
      return;
    }

    if (quantity <= 0 || quantity > selectedVariant.stock) {
      alert(`Please select a quantity between 1 and ${selectedVariant.stock}.`);
      return;
    }

    // Call the mutation
    addToCartMutation.mutate({
      productVariantId: selectedVariant.id,
      quantity: quantity,
    });
  };

  // --- NEW PRICE CALCULATION LOGIC ---
  // Get the base price for the currently selected configuration (variant or product)
  const currentBasePrice = selectedVariant
    ? selectedVariant.price
    : data?.product.basePrice; // Fallback to data?.product's base price if no variant selected

  // Determine the best active discount percentage for the data?.product
  const bestDiscountPercentage = useMemo(() => {
    if (
      !data?.product ||
      !data?.product.discounts ||
      data?.product.discounts.length === 0
    ) {
      return 0; // No discounts or data?.product data
    }
    // Assumes data?.product.discounts are already ordered by percentage: 'desc' from API
    const activeDiscounts = data?.product.discounts.filter(
      (d: { expiresAt: string | number | Date }) =>
        d.expiresAt && new Date(d.expiresAt) >= new Date()
    );
    if (activeDiscounts.length > 0) {
      return activeDiscounts[0].percentage; // Take the highest active discount
    }
    return 0;
  }, [data?.product]);

  // Calculate the final display price by applying the discount to the currentBasePrice
  const finalDisplayPrice = useMemo(() => {
    if (currentBasePrice === undefined || currentBasePrice === null) {
      return 0; // Or handle as desired
    }
    if (bestDiscountPercentage > 0) {
      const priceAfterDiscount =
        currentBasePrice * (1 - bestDiscountPercentage / 100);
      return parseFloat(priceAfterDiscount.toFixed(2)); // Ensure proper rounding
    }
    return currentBasePrice;
  }, [bestDiscountPercentage, currentBasePrice]);

  // Determine if there's an actual discount applied for display (line-through price)
  const isDiscountApplied = finalDisplayPrice < currentBasePrice;

  const isAddToCartButtonDisabled =
    !selectedVariant ||
    selectedVariant.stock === 0 ||
    quantity === 0 ||
    addToCartMutation.isPending;
  if (isLoading) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="text-red-600 text-lg">
          Error loading product details: {error.message}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-10">
      <Breadcrumb className="md:block hidden px-5">
        <BreadcrumbList className="dark:text-white text-black">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/"
              className="text-xs md:text-sm font-normal font-sans"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className=" text-xs md:text-sm font-normal font-sans">
              Shop
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/${data?.product.category.slug}`}
              className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans line-clamp-1"
            >
              {data?.product.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/${data?.product.category.slug}/${data?.product.subCategory.slug}`}
              className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans line-clamp-1"
            >
              {data?.product.subCategory.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans line-clamp-1">
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
            <div className="flex justify-start items-center gap-2">
              <span className="font-bold text-2xl lg:text-3xl text-start">
                {formatCurrencyValue(
                  finalDisplayPrice || data?.product?.discountedPrice
                )}
              </span>
              {isDiscountApplied && (
                <span className="font-light text-base  text-start text-black/30 dark:text-white/50 line-through decoration-black/30 dark:decoration-white/50">
                  {formatCurrencyValue(currentBasePrice)}
                </span>
              )}
              {data?.product.discountedPrice && (
                <span className="font-medium tracking-wide text-sm text-center text-white dark:text-black dark:bg-white bg-black/65 rounded-full p-1 px-1.5">
                  {data?.product?.discounts?.[0]?.percentage}
                  {/* {percentageDifference(
                    // @ts-ignore
                    data?.product.price,
                    data?.product.discountedPrice
                  )} */}
                  % off
                </span>
              )}
            </div>

            {/* <h2 className="font-medium text-lg text-wrap">
              {data?.product.name}
            </h2> */}
            <p className="hidden md:line-clamp-3 lg:line-clamp-none text-base text-start text-black/70 dark:text-white/70">
              {data?.product.description}
            </p>
          </div>
          <Separator />
          {data.product.variants.length > 0 && (
            <div className="space-y-4 mt-4 w-full">
              {/* Size Selector */}
              {availableSizes.length > 0 && (
                <div>
                  <Label
                    htmlFor="size-select"
                    className="mb-2 block font-semibold"
                  >
                    Size
                  </Label>
                  <Select
                    onValueChange={setSelectedSize}
                    value={selectedSize || undefined}
                  >
                    <SelectTrigger id="size-select" className="w-full">
                      <SelectValue placeholder="Select a size" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map((size) => (
                        <SelectItem
                          key={size}
                          value={size}
                          // disabled={
                          //   !getAvailableSizesForColor(selectedColor).has(size)
                          // } // Disable if not available for selected color
                        >
                          {size}{" "}
                          {selectedColor &&
                          !getAvailableSizesForColor(selectedColor).has(size)
                            ? "(Unavailable for this color)"
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Color Selector (Visual Swatches are a great upgrade here!) */}
              {availableColors.length > 0 && (
                <div>
                  <Label
                    htmlFor="color-select"
                    className="mb-2 block font-semibold"
                  >
                    Color
                  </Label>
                  <Select
                    onValueChange={setSelectedColor}
                    value={selectedColor || undefined}
                  >
                    <SelectTrigger id="color-select" className="w-full">
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableColors.map((color) => (
                          <SelectItem
                            key={color}
                            value={color}
                            // disabled={
                            //   !getAvailableColorsForSize(selectedSize).has(
                            //     color
                            //   )
                            // } // Disable if not available for selected size
                          >
                            {color}{" "}
                            {selectedSize &&
                            !getAvailableColorsForSize(selectedSize).has(color)
                              ? "(Unavailable for this size)"
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          {/* COLOR SELECTORS */}
          <div className="space-y-3">
            {/* <span className="text-base font-medium capitalize text-start">
              select color
            </span> */}

            {/* <div className="flex gap-3 items-start justify-start">
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
            </div> */}
          </div>

          <div className="flex gap-4 mt-4 items-center justify-start w-full">
            <div className="flex items-center gap-3 border h-10 rounded-full">
              <button
                className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-l-full"
                onClick={() => {
                  // setQuantity(quantity > 1 ? quantity - 1 : 1);
                  setQuantity((prev) => Math.max(1, prev - 1));
                }}
                disabled={quantity <= 1}
              >
                <MinusIcon className="w-4 h-4" />
              </button>

              {/* <span className="w-fit px-2">{quantity}</span> */}
              {/* {items.length > 0 ? (
                <div>
                  {items.map((item) => (
                    <span className="w-fit px-2">{item.quantity}</span>
                  ))}
                </div>
              ) : ( */}
              <div>
                {/* {items.map((item) => ( */}
                <span className="w-fit px-2">{quantity}</span>
                {/* ))} */}
              </div>
              {/* // )} */}
              <button
                className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-r-full"
                onClick={() => {
                  // if (items.length > 0) {
                  //   updateItemQuantity(
                  //     data?.product.id as string,
                  //     "increase",
                  //     selectedSize as string,
                  //     selectedColor as string
                  //   );
                  // } else {
                  //   setQuantity(quantity < 10 ? quantity + 1 : 10);
                  // }
                  setQuantity((prev) =>
                    Math.min(selectedVariant?.stock, prev + 1)
                  );
                }}
                disabled={quantity >= selectedVariant?.stock}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* <button
              className="flex items-center justify-center w-full h-10 text-lg border border-black text-white text-center bg-black dark:bg-white dark:text-black hover:bg-white hover:text-black rounded-full flex-grow transition-transform delay-150 duration-200 ease-in-out"
              onClick={() => {
                createCartItem({ success: false, error: false }, {...cartData, userId: user?.id as string })
               
              }}
            >
              Add To Cart
            </button> */}
            {/* {items.length > 0 ? (
              <div>
                {items.map((item) => (
                  <span>{item.quantity} item(s) added</span>
                ))}
              </div>
            ) : ( */}
            <AddToCartButton
              productName={data?.product.productName}
              onAddToCartClick={handleAddToCart}
              isDisabled={isAddToCartButtonDisabled}
              isAddingToCart={addToCartMutation.isPending}
            />
            {/* )} */}
          </div>
        </div>
      </div>

      {/* PRODUCT FULL DETAILS AND REVIEWS */}
      <div className="mx-auto max-w-screen-2xl px-5">
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
          <TabsContent value="details">{data?.product.description}</TabsContent>
          <TabsContent value="reviews">
            {data?.product.reviews.length > 0 ? (
              <div className="grid grid-cols-2 items-stretch justify-start space-x-5">
                {data?.product.reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="w-full p-4 border rounded-lg border-gray-300 bg-white shadow-sm"
                  >
                    <div className="flex flex-col-reverse items-start justify-start space-y-2 mb-2">
                      <span className="font-semibold">
                        {getFirstName(review.user.name)}{" "}
                        {getLastName(review.user.name)}.
                      </span>
                      <span className="text-yellow-500 text-3xl">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                    </div>
                    <p className="text-gray-700">"{review.comment}"</p>

                    <p className="text-gray-500 text-sm mt-2">
                      Posted on{" "}
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-start justify-start space-y-5">
                <h3 className="text-xl font-semibold">Customer Reviews</h3>
                <p className="text-gray-600">
                  No reviews yet. Be the first to review this product!
                </p>
              </div>
            )}
            {/* Placeholder for reviews component */}
            <div className="flex flex-col items-start justify-start space-y-5">
              <h3 className="text-xl font-semibold">Customer Reviews</h3>
              <p className="text-gray-600">
                No reviews yet. Be the first to review this product!
              </p>
              {/* Add review form or component here */}
              <div className="w-full max-w-md">
                <Label htmlFor="review" className="block mb-2">
                  Write a Review
                </Label>
                <textarea
                  id="review"
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share your thoughts about this product..."
                ></textarea>
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Submit Review
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-5">
        {/* <RelatedProducts
          tag={data?.product.productTag[0]}
          name={data?.product.productName as string}
        /> */}
      </div>
      <div className="mt-5">
        <RecentlyViewed />
      </div>
    </div>
  );
};

export default ProductDetails;
