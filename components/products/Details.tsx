"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  CheckIcon,
  MinusIcon,
  PlusIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-toastify";
import parse from "html-react-parser";
import useSWR from "swr";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ThumbnailGallery from "../ui/ThumbnailGallery";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import {
  ProductReview,
  ProductVariant,
  User,
  VariantType,
} from "@prisma/client";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Helper for currency formatting if the util is missing

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch");
  return data;
};

const ProductDetails = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const { data, error, isLoading } = useSWR(`/api/products/${slug}`, fetcher);
  const product = data?.product || null;

  // const availableColors = useMemo(() => {
  //   if (!product?.colorFamily) return [];
  //   const colors = product.colorFamily
  //     .map((v: any) => v)
  //     .filter(Boolean) as string[];
  //   return Array.from(new Set(colors));
  // }, [product]);

  // Derive selected variant object
  const selectedVariant = useMemo(() => {
    return (
      product?.variants?.find(
        (v: ProductVariant) => v.id === selectedVariantId
      ) || null
    );
  }, [product, selectedVariantId]);

  // Handle Initial Variant Selection
  useEffect(() => {
    if (product?.variants?.length > 0) {
      // Set initial color if available
      if (product.colorFamily?.length > 0 && !selectedColor) {
        setSelectedColor(product.colorFamily[0] as string);
      }

      // Set initial variant if not set
      if (!selectedVariantId) {
        const firstAvailable =
          product.variants.find((v: { quantity: number }) => v.quantity > 0) ||
          product.variants[0];
        setSelectedVariantId(firstAvailable.id);
        if (firstAvailable.colorFamily || firstAvailable.color) {
          setSelectedColor(firstAvailable.colorFamily || firstAvailable.color);
        }
      }
    }
  }, [product, selectedVariantId, selectedColor]);

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
      if (!res.ok) throw new Error("Failed to add to cart");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item added to cart");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Price Calculation Logic
  const priceInfo = useMemo(() => {
    if (!selectedVariant) return { original: 0, current: 0, isSale: false };

    const now = new Date();
    const hasActiveSale =
      selectedVariant.salePrice &&
      (!selectedVariant.saleStartDate ||
        new Date(selectedVariant.saleStartDate) <= now) &&
      (!selectedVariant.saleEndDate ||
        new Date(selectedVariant.saleEndDate) >= now);

    return {
      original: selectedVariant.price,
      current: hasActiveSale
        ? selectedVariant.salePrice
        : selectedVariant.price,
      isSale: hasActiveSale,
      discountPercent: hasActiveSale
        ? Math.round(
            ((selectedVariant.price - selectedVariant.salePrice) /
              selectedVariant.price) *
              100
          )
        : 0,
    };
  }, [selectedVariant]);

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant) return toast.error("Please select a variant");
    if (selectedVariant.quantity <= 0) return toast.error("Out of stock");

    addToCartMutation.mutate({
      productVariantId: selectedVariant.id,
      quantity,
    });
  }, [selectedVariant, quantity, addToCartMutation]);

  if (isLoading)
    return (
      <div className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[400px] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-gray-800" />
      </div>
    );

  if (error || !product)
    return (
      <div className="p-20 text-center text-red-500">Product not found</div>
    );

  return (
    <div className="space-y-7 max-w-screen-xl mx-auto px-4 py-3 font-sans">
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/category/${product.category?.slug}`}>
              {product.category?.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/category/${product.category?.slug}/${product.subCategory?.slug}`}
            >
              {product.subCategory?.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans truncate text w-[200px]">
              {data?.product.productName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <ThumbnailGallery
            images={
              product.images?.length > 0
                ? product.images
                : ["/api/placeholder/800/800"]
            }
            id={product.id}
            name={product.name}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-sm text-gray-500 tracking-wide uppercase">
              Brand: {product.brand || "Generic"}
            </p>

            <div className="flex items-center gap-4 mt-6">
              <span className="text-4xl font-extrabold text-blue-600">
                {formatCurrencyValue(priceInfo.current)}
              </span>
              {priceInfo.isSale && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrencyValue(priceInfo.original)}
                  </span>
                  <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                    {priceInfo.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {selectedVariant && (
              <p
                className={`text-sm font-semibold mt-2 ${
                  selectedVariant.quantity < 10
                    ? "text-orange-600"
                    : "text-emerald-600"
                }`}
              >
                {selectedVariant.quantity > 0
                  ? `Only ${selectedVariant.quantity} units left in stock!`
                  : "Out of Stock"}
              </p>
            )}
          </div>

          <Separator />

          {/* Variant Selector */}
          {/* {(product.subSubCategory.productVariantType === VariantType.SIZE ||
            product.subSubCategory.productVariantType ===
              VariantType.SIZE_SHOE ||
            product.subSubCategory.productVariantType ===
              VariantType.DRINK_SIZE ||
            product.subSubCategory.productVariantType ===
              VariantType.VOLUME) && ( */}
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">
              Select{" "}
              {product.subSubCategory.productVariantType === VariantType.SIZE
                ? "Size"
                : product.subSubCategory.productVariantType ===
                  VariantType.SIZE_SHOE
                ? "Size"
                : product.subSubCategory.productVariantType ===
                  VariantType.DRINK_SIZE
                ? "Pack"
                : product.subSubCategory.productVariantType ===
                  VariantType.VOLUME
                ? "Volume"
                : "Variation"}
            </Label>
            <Select
              value={selectedVariantId}
              onValueChange={setSelectedVariantId}
            >
              <SelectTrigger className="w-full h-14 rounded-xl border-2 border-gray-100 bg-white text-base font-bold text-gray-700 focus:ring-blue-600">
                <SelectValue placeholder="Select a variation" />
              </SelectTrigger>
              <SelectContent>
                {product.variants?.map((v: ProductVariant) => (
                  <SelectItem
                    key={v.id}
                    value={v.id}
                    disabled={v.quantity <= 0}
                    className="py-3 font-semibold"
                  >
                    <div className="flex justify-between items-center w-full min-w-[280px]">
                      <span>
                        {v.size ||
                          v.volume ||
                          v.drinkSize ||
                          v.variation ||
                          "Standard"}
                      </span>
                      {v.quantity <= 0 && (
                        <span className="ml-2 text-[10px] text-red-500 uppercase font-black">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* // )} */}

          {/* Color Selector (Conditional) */}
          {product.colorFamily?.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                Color Family
              </label>
              <Select
                value={selectedColor}
                onValueChange={(val) => {
                  setSelectedColor(val);
                  // Reset variant ID to first available in this color
                  const firstInColor = product.variants.find(
                    (v: { colorFamily: any; color: any }) =>
                      (v.colorFamily || v.color) === val
                  );
                  if (firstInColor) setSelectedVariantId(firstInColor.id);
                }}
              >
                <SelectTrigger className="w-full h-14 rounded-xl border-2 border-gray-100 bg-white text-base font-bold text-gray-700 focus:ring-blue-600">
                  <SelectValue placeholder="Choose a color" />
                </SelectTrigger>
                <SelectContent>
                  {product.colorFamily.map((color: string) => (
                    <SelectItem
                      key={color}
                      value={color}
                      className="py-3 font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                        {color}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center border-2 border-gray-100 rounded-full overflow-hidden h-14 w-full sm:w-fit bg-white shadow-sm">
              <button
                className="px-6 hover:bg-gray-50 transition-colors disabled:opacity-20"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <MinusIcon className="w-5 h-5 text-gray-600" />
              </button>
              <span className="w-10 text-center font-black text-lg">
                {quantity}
              </span>
              <button
                className="px-6 hover:bg-gray-50 transition-colors disabled:opacity-20"
                onClick={() => setQuantity((q) => q + 1)}
                disabled={quantity >= (selectedVariant?.quantity || 1)}
              >
                <PlusIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={
                !selectedVariant ||
                selectedVariant.quantity <= 0 ||
                addToCartMutation.isPending
              }
              className="h-14 flex-grow bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-full transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-5 gap-6 flex flex-col-reverse">
        <Tabs defaultValue="details" className="w-full lg:col-span-3">
          <TabsList className="w-full justify-start border-b bg-transparent rounded-none h-auto p-0 mb-8 flex gap-8">
            <TabsTrigger
              value="details"
              className="px-0 py-4 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-600 bg-transparent text-lg font-bold text-gray-400 data-[state=active]:text-gray-900"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="px-0 py-4 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-600 bg-transparent text-lg font-bold text-gray-400 data-[state=active]:text-gray-900"
            >
              Reviews ({product.reviews?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="max-w-4xl">
            <div
              className={`relative transition-all duration-500 ${
                !isExpanded ? "max-h-64 overflow-hidden" : ""
              }`}
            >
              <div className="text-gray-700 leading-loose text-lg space-y-4">
                {parse(product.description || "")}
              </div>
              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
              )}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-6 flex items-center text-blue-600 font-black text-sm uppercase tracking-widest hover:text-blue-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  Show Less <ChevronUp className="ml-1 w-4 h-4" />
                </>
              ) : (
                <>
                  Read Full Description <ChevronDown className="ml-1 w-4 h-4" />
                </>
              )}
            </button>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-8 max-w-3xl">
              {product.reviews?.length > 0 ? (
                product.reviews.map(
                  (review: ProductReview & { user: User }) => (
                    <div
                      key={review.id}
                      className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                          ))}
                        </div>
                        <span className="text-sm font-black text-gray-900">
                          {review.user?.name}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    </div>
                  )
                )
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <p className="text-gray-400 font-medium">
                    No reviews yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {product.highlight && (
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 col-span-2">
            <h4 className="text-gray-900 font-black text-xs uppercase tracking-widest mb-2">
              Product Highlights
            </h4>
            <div className="text-gray-600 text-sm leading-relaxed">
              {parse(product.highlight)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
