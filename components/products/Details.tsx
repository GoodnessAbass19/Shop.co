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
import { useUser } from "@/Hooks/user-context";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const { refetchCart } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  // We toggle this state to switch between "clamped" and "visible"
  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  const { data, error, isLoading } = useSWR(`/api/products/${slug}`, fetcher);

  const product = data?.product || null;

  // fallback images if none available
  const fallbackImages = [
    { url: "https://via.placeholder.com/800x800?text=No+Image" },
  ];

  // derive basic product info safely
  const {
    images = fallbackImages,
    productName = "",
    id = "",
    price: productBasePrice = 0,
    variants = [],
    discounts = [],
    category,
    subCategory,
  } = product || {};

  // VARIANTS & SELECTION STATE
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Add to cart mutation
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productVariantId, quantity }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to add to cart.");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      refetchCart?.();
      toast.success("Item added to cart");
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not add item to cart");
      router.push(`/sign-in?redirectUrl=/products/${slug}`);
    },
  });

  // derive available sizes/colors
  const availableSizes = useMemo(() => {
    if (!variants) return [];
    const s = new Set<string>();
    variants.forEach((v: any) => v.size && v.stock > 0 && s.add(v.size));
    return Array.from(s);
  }, [variants]);

  const availableColors = useMemo(() => {
    if (!variants) return [];
    const s = new Set<string>();
    variants.forEach((v: any) => v.color && v.stock > 0 && s.add(v.color));
    return Array.from(s);
  }, [variants]);

  const getSizesForColor = useCallback(
    (color: string | null) => {
      const s = new Set<string>();
      variants.forEach((v: any) => {
        if ((!color || v.color === color) && v.size && v.stock > 0)
          s.add(v.size);
      });
      return s;
    },
    [variants]
  );

  const getColorsForSize = useCallback(
    (size: string | null) => {
      const s = new Set<string>();
      variants.forEach((v: any) => {
        if ((!size || v.size === size) && v.color && v.stock > 0)
          s.add(v.color);
      });
      return s;
    },
    [variants]
  );

  // synchronize variant whenever selections change
  useEffect(() => {
    if (!variants) return setSelectedVariant(null);
    const found =
      variants.find(
        (v: any) => v.size === selectedSize && v.color === selectedColor
      ) || null;
    setSelectedVariant(found);

    // set quantity default
    if (found && found.stock > 0) setQuantity(1);
    else setQuantity(0);
  }, [variants, selectedSize, selectedColor]);

  // keep selections valid when one changes
  useEffect(() => {
    if (selectedSize && selectedColor) return; // both chosen

    // if size chosen but color incompatible -> unset color
    if (selectedSize) {
      const colors = getColorsForSize(selectedSize);
      if (selectedColor && !colors.has(selectedColor)) setSelectedColor(null);
    }

    if (selectedColor) {
      const sizes = getSizesForColor(selectedColor);
      if (selectedSize && !sizes.has(selectedSize)) setSelectedSize(null);
    }
  }, [selectedSize, selectedColor, getColorsForSize, getSizesForColor]);

  // PRICE CALCULATION: choose variant price if present -> product base price fallback
  const currentBasePrice = selectedVariant?.price ?? productBasePrice ?? 0;

  const bestDiscount = useMemo(() => {
    if (!discounts || discounts.length === 0) return 0;
    const active = discounts.filter((d: any) =>
      d.expiresAt ? new Date(d.expiresAt) >= new Date() : true
    );
    if (!active.length) return 0;
    // pick max percentage
    return Math.max(...active.map((d: any) => d.percentage || 0));
  }, [discounts]);

  const finalPrice = useMemo(() => {
    if (!currentBasePrice) return 0;
    if (bestDiscount > 0)
      return parseFloat(
        (currentBasePrice * (1 - bestDiscount / 100)).toFixed(2)
      );
    return currentBasePrice;
  }, [currentBasePrice, bestDiscount]);

  const isDiscountApplied = finalPrice < currentBasePrice;

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!selectedVariant) return toast.error("Please select size & color");
    if (selectedVariant.stock === 0)
      return toast.error("Selected variant is out of stock");
    if (quantity < 1 || quantity > selectedVariant.stock)
      return toast.error("Invalid quantity");

    addToCartMutation.mutate({
      productVariantId: selectedVariant.id,
      quantity,
    });
  }, [selectedVariant, quantity, addToCartMutation]);

  // Loading / Error states
  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[400px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-gray-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[400px] flex items-center justify-center text-red-600">
        Error loading product: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <Breadcrumb className="md:block hidden px-3">
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
              className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans line-clamp-1 text-ellipsis"
            >
              {(data?.product.category.name as string).substring(0, 10)}
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
            <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans line-clamp-1 text">
              {(data?.product.productName as string).substring(0, 20)}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* PRODUCT INAGES AND DETAILS */}
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-5 items-start justify-start w-full gap-4 px-2.5">
        <div className="col-span-3 w-full">
          <ThumbnailGallery images={images} id={id} name={productName} />
        </div>

        <div className="flex flex-col space-y-3 items-start justify-start col-span-2">
          <div className="grid gap-2 justify-start items-start">
            <div className="flex justify-start items-center gap-2">
              <span className="font-semibold font-serif text-xl md:text-2xl text-start">
                {formatCurrencyValue(
                  finalPrice || data?.product?.discountedPrice
                )}
              </span>
              {isDiscountApplied && (
                <span className="font-light text-base text-start text-black/30 dark:text-white/50 line-through decoration-black/30 dark:decoration-white/50">
                  {formatCurrencyValue(currentBasePrice)}
                </span>
              )}
              {data?.product.discountedPrice && (
                <span className="font-medium tracking-wide text-sm text-center text-white dark:text-black dark:bg-white bg-black/65 rounded-full p-1 px-1.5">
                  -{data?.product?.discounts?.[0]?.percentage}% off
                </span>
              )}
            </div>
            <span className="text-sm text-start text-red-500/70 h-5">
              {selectedVariant && selectedVariant.stock <= 10
                ? `${selectedVariant.stock} unit available in stock`
                : ""}
            </span>
            <h2 className="text-base text-wrap font-medium font-serif mb-2">
              {data?.product.name}
            </h2>
          </div>
          <Separator />

          {/* Variant selectors */}
          <div className="mt-4 space-y-4 w-full">
            {availableSizes.length > 0 && (
              <div>
                <Label className="mb-2">Size</Label>
                <Select
                  value={selectedSize ?? undefined}
                  onValueChange={(val: string) => setSelectedSize(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}{" "}
                        {selectedColor &&
                        !getSizesForColor(selectedColor).has(s)
                          ? "(Unavailable)"
                          : ``}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {availableColors.length > 0 && (
              <div>
                <Label className="mb-2">Color</Label>

                {/* Etsy-style color swatches */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {availableColors.map((color) => {
                    const isDisabled =
                      selectedSize &&
                      !getColorsForSize(selectedSize).has(color);
                    const isSelected = selectedColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={!!isDisabled}
                        title={color}
                        onClick={() => setSelectedColor(color)}
                        className={`
w-9 h-9 rounded-full border-2 flex items-center justify-center
transition shadow-sm
${isSelected ? "border-black" : "border-gray-300"}
${isDisabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105"}
`}
                        style={{ backgroundColor: color.toLowerCase() }}
                      >
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-white drop-shadow" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-5 items-center justify-start w-full">
            <div className="flex items-center gap-3 border h-10 rounded-full">
              <button
                className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-l-full"
                onClick={() => {
                  setQuantity((prev) => Math.max(1, prev - 1));
                }}
                disabled={quantity <= 1}
              >
                <MinusIcon className="w-4 h-4" />
              </button>

              <div>
                <span className="w-fit px-2">{quantity}</span>
              </div>
              <button
                className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-r-full"
                onClick={() => {
                  setQuantity((prev) =>
                    Math.min(selectedVariant?.stock, prev + 1)
                  );
                }}
                disabled={quantity >= selectedVariant?.stock}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            <AddToCartButton
              productName={data?.product.productName}
              onAddToCartClick={handleAddToCart}
              isDisabled={
                !selectedVariant || quantity <= 0 || addToCartMutation.isPending
              }
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
              className="text-lg font-medium capitalize text-center data-[state=active]:text-[#4A90E2] data-[state=active]:bg-white data-[state=active]:border-b-2 border-b-[#4A90E2]"
            >
              product details
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="text-lg font-medium capitalize text-center data-[state=active]:text-[#4A90E2] data-[state=active]:bg-white data-[state=active]:border-b-2 border-b-[#4A90E2]"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div>
              <p
                className={`text-gray-700 leading-relaxed transition-all duration-300`}
                style={
                  isExpanded
                    ? {}
                    : {
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }
                }
              >
                {data?.product.description}
              </p>

              <button
                onClick={toggleReadMore}
                className="mt-2 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
              >
                {isExpanded ? (
                  <>
                    Show Less <ChevronUp size={16} className="ml-1" />
                  </>
                ) : (
                  <>
                    Read More <ChevronDown size={16} className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </TabsContent>
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
