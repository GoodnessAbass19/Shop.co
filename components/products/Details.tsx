// "use client";

// import ThumbnailGallery from "../ui/ThumbnailGallery";
// import { Separator } from "@/components/ui/separator";
// import { formatCurrencyValue } from "@/utils/format-currency-value";
// import { CheckIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
// import { useEffect, useMemo, useState, useCallback } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import RecentlyViewed from "./Recent";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb";
// import { AddToCartButton } from "../layout/Toast";
// import { toast } from "react-toastify";
// import parse from "html-react-parser";
// import useSWR from "swr";
// import { Label } from "../ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useRouter } from "next/navigation";
// import { getFirstName, getInitials, getLastName } from "@/lib/utils";
// import { useUser } from "@/Hooks/user-context";
// import { ChevronDown, ChevronUp } from "lucide-react";

// const fetcher = async (url: string) => {
//   const res = await fetch(url);
//   const data = await res.json();
//   if (!res.ok) {
//     const error: any = new Error(data.error || "Failed to fetch data.");
//     error.status = res.status;
//     throw error;
//   }
//   return data;
// };

// const ProductDetails = ({ slug }: { slug: string }) => {
//   const { refetchCart } = useUser();
//   const router = useRouter();
//   const queryClient = useQueryClient();
//   const [isExpanded, setIsExpanded] = useState(false);

//   // We toggle this state to switch between "clamped" and "visible"
//   const toggleReadMore = () => {
//     setIsExpanded(!isExpanded);
//   };

//   const { data, error, isLoading } = useSWR(`/api/products/${slug}`, fetcher);

//   const product = data?.product || null;

//   // fallback images if none available
//   const fallbackImages = [
//     { url: "https://via.placeholder.com/800x800?text=No+Image" },
//   ];

//   // derive basic product info safely
//   const {
//     images = fallbackImages,
//     productName = "",
//     id = "",
//     price: productBasePrice = 0,
//     variants = [],
//     discounts = [],
//     category,
//     subCategory,
//   } = product || {};

//   // VARIANTS & SELECTION STATE
//   const [selectedSize, setSelectedSize] = useState<string | null>(null);
//   const [selectedColor, setSelectedColor] = useState<string | null>(null);
//   const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
//   const [quantity, setQuantity] = useState<number>(1);

//   // Add to cart mutation
//   const addToCartMutation = useMutation({
//     mutationFn: async ({
//       productVariantId,
//       quantity,
//     }: {
//       productVariantId: string;
//       quantity: number;
//     }) => {
//       const res = await fetch("/api/cart/add", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ productVariantId, quantity }),
//       });
//       const body = await res.json();
//       if (!res.ok) throw new Error(body.error || "Failed to add to cart.");
//       return body;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["cart"] });
//       refetchCart?.();
//       toast.success("Item added to cart");
//     },
//     onError: (err: any) => {
//       toast.error(err.message || "Could not add item to cart");
//       router.push(`/sign-in?redirectUrl=/products/${slug}`);
//     },
//   });

//   // derive available sizes/colors
//   const availableSizes = useMemo(() => {
//     if (!variants) return [];
//     const s = new Set<string>();
//     variants.forEach((v: any) => v.size && v.stock > 0 && s.add(v.size));
//     return Array.from(s);
//   }, [variants]);

//   const availableColors = useMemo(() => {
//     if (!variants) return [];
//     const s = new Set<string>();
//     variants.forEach((v: any) => v.color && v.stock > 0 && s.add(v.color));
//     return Array.from(s);
//   }, [variants]);

//   const getSizesForColor = useCallback(
//     (color: string | null) => {
//       const s = new Set<string>();
//       variants.forEach((v: any) => {
//         if ((!color || v.color === color) && v.size && v.stock > 0)
//           s.add(v.size);
//       });
//       return s;
//     },
//     [variants]
//   );

//   const getColorsForSize = useCallback(
//     (size: string | null) => {
//       const s = new Set<string>();
//       variants.forEach((v: any) => {
//         if ((!size || v.size === size) && v.color && v.stock > 0)
//           s.add(v.color);
//       });
//       return s;
//     },
//     [variants]
//   );

//   // synchronize variant whenever selections change
//   useEffect(() => {
//     if (!variants) return setSelectedVariant(null);
//     const found =
//       variants.find(
//         (v: any) => v.size === selectedSize && v.color === selectedColor
//       ) || null;
//     setSelectedVariant(found);

//     // set quantity default
//     if (found && found.stock > 0) setQuantity(1);
//     else setQuantity(0);
//   }, [variants, selectedSize, selectedColor]);

//   // keep selections valid when one changes
//   useEffect(() => {
//     if (selectedSize && selectedColor) return; // both chosen

//     // if size chosen but color incompatible -> unset color
//     if (selectedSize) {
//       const colors = getColorsForSize(selectedSize);
//       if (selectedColor && !colors.has(selectedColor)) setSelectedColor(null);
//     }

//     if (selectedColor) {
//       const sizes = getSizesForColor(selectedColor);
//       if (selectedSize && !sizes.has(selectedSize)) setSelectedSize(null);
//     }
//   }, [selectedSize, selectedColor, getColorsForSize, getSizesForColor]);

//   // PRICE CALCULATION: choose variant price if present -> product base price fallback
//   const currentBasePrice = selectedVariant?.price ?? productBasePrice ?? 0;

//   const bestDiscount = useMemo(() => {
//     if (!discounts || discounts.length === 0) return 0;
//     const active = discounts.filter((d: any) =>
//       d.expiresAt ? new Date(d.expiresAt) >= new Date() : true
//     );
//     if (!active.length) return 0;
//     // pick max percentage
//     return Math.max(...active.map((d: any) => d.percentage || 0));
//   }, [discounts]);

//   const finalPrice = useMemo(() => {
//     if (!currentBasePrice) return 0;
//     if (bestDiscount > 0)
//       return parseFloat(
//         (currentBasePrice * (1 - bestDiscount / 100)).toFixed(2)
//       );
//     return currentBasePrice;
//   }, [currentBasePrice, bestDiscount]);

//   const isDiscountApplied = finalPrice < currentBasePrice;

//   // Add to cart handler
//   const handleAddToCart = useCallback(() => {
//     if (!selectedVariant) return toast.error("Please select size & color");
//     if (selectedVariant.stock === 0)
//       return toast.error("Selected variant is out of stock");
//     if (quantity < 1 || quantity > selectedVariant.stock)
//       return toast.error("Invalid quantity");

//     addToCartMutation.mutate({
//       productVariantId: selectedVariant.id,
//       quantity,
//     });
//   }, [selectedVariant, quantity, addToCartMutation]);

//   // Loading / Error states
//   if (isLoading) {
//     return (
//       <div className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[400px] flex items-center justify-center">
//         <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-gray-800" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="max-w-screen-xl mx-auto mt-10 p-4 min-h-[400px] flex items-center justify-center text-red-600">
//         Error loading product: {error.message}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-7">
//       <Breadcrumb className="md:block hidden px-3">
//         <BreadcrumbList className="dark:text-white text-black">
//           <BreadcrumbItem>
//             <BreadcrumbLink
//               href="/"
//               className="text-xs md:text-sm font-normal font-sans"
//             >
//               Home
//             </BreadcrumbLink>
//           </BreadcrumbItem>
//           <BreadcrumbSeparator />
//           <BreadcrumbItem>
//             <BreadcrumbLink
//               href={`/${data?.product.category.slug}`}
//               className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans line-clamp-1 text-ellipsis"
//             >
//               {(data?.product.category.name as string).substring(0, 10)}
//             </BreadcrumbLink>
//           </BreadcrumbItem>
//           <BreadcrumbSeparator />
//           <BreadcrumbItem>
//             <BreadcrumbLink
//               href={`/${data?.product.category.slug}/${data?.product.subCategory.slug}`}
//               className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans line-clamp-1"
//             >
//               {data?.product.subCategory.name}
//             </BreadcrumbLink>
//           </BreadcrumbItem>
//           <BreadcrumbSeparator />
//           <BreadcrumbItem>
//             <BreadcrumbPage className="dark:text-white text-black capitalize text-xs md:text-sm font-normal font-sans truncate text w-[200px]">
//               {data?.product.productName}
//             </BreadcrumbPage>
//           </BreadcrumbItem>
//         </BreadcrumbList>
//       </Breadcrumb>

//       {/* PRODUCT INAGES AND DETAILS */}
//       <div className="mx-auto grid grid-cols-1 lg:grid-cols-5 items-start justify-start w-full gap-4 px-2.5">
//         <div className="col-span-3 w-full">
//           <ThumbnailGallery images={images} id={id} name={productName} />
//         </div>

//         <div className="flex flex-col space-y-3 items-start justify-start col-span-2">
//           <div className="grid gap-2 justify-start items-start">
//             <div className="flex justify-start items-center gap-2">
//               <span className="font-semibold font-serif text-xl md:text-2xl text-start">
//                 {formatCurrencyValue(
//                   finalPrice || data?.product?.discountedPrice
//                 )}
//               </span>
//               {isDiscountApplied && (
//                 <span className="font-light text-base text-start text-black/30 dark:text-white/50 line-through decoration-black/30 dark:decoration-white/50">
//                   {formatCurrencyValue(currentBasePrice)}
//                 </span>
//               )}
//               {data?.product.discountedPrice && (
//                 <span className="font-medium tracking-wide text-sm text-center text-white dark:text-black dark:bg-white bg-black/65 rounded-full p-1 px-1.5">
//                   -{data?.product?.discounts?.[0]?.percentage}% off
//                 </span>
//               )}
//             </div>
//             <span className="text-sm text-start text-red-500/70 h-5">
//               {selectedVariant && selectedVariant.stock <= 10
//                 ? `${selectedVariant.stock} unit available in stock`
//                 : ""}
//             </span>
//             <h2 className="text-base text-wrap font-medium font-serif mb-2">
//               {data?.product.name}
//             </h2>
//           </div>
//           <Separator />

//           {/* Variant selectors */}
//           <div className="mt-4 space-y-4 w-full">
//             {availableSizes.length > 0 && (
//               <div>
//                 <Label className="mb-2">Size</Label>
//                 <Select
//                   value={selectedSize ?? undefined}
//                   onValueChange={(val: string) => setSelectedSize(val)}
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Choose size" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {availableSizes.map((s) => (
//                       <SelectItem key={s} value={s}>
//                         {s}{" "}
//                         {selectedColor &&
//                         !getSizesForColor(selectedColor).has(s)
//                           ? "(Unavailable)"
//                           : ``}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             {availableColors.length > 0 && (
//               <div>
//                 <Label className="mb-2">Color</Label>

//                 {/* Etsy-style color swatches */}
//                 <div className="flex flex-wrap gap-3 mt-2">
//                   {availableColors.map((color) => {
//                     const isDisabled =
//                       selectedSize &&
//                       !getColorsForSize(selectedSize).has(color);
//                     const isSelected = selectedColor === color;

//                     return (
//                       <button
//                         key={color}
//                         type="button"
//                         disabled={!!isDisabled}
//                         title={color}
//                         onClick={() => setSelectedColor(color)}
//                         className={`
// w-9 h-9 rounded-full border-2 flex items-center justify-center
// transition shadow-sm
// ${isSelected ? "border-black" : "border-gray-300"}
// ${isDisabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105"}
// `}
//                         style={{ backgroundColor: color.toLowerCase() }}
//                       >
//                         {isSelected && (
//                           <CheckIcon className="w-4 h-4 text-white drop-shadow" />
//                         )}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="flex flex-col sm:flex-row gap-4 mt-5 items-center justify-start w-full">
//             <div className="flex items-center gap-3 border h-10 rounded-full">
//               <button
//                 className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-l-full"
//                 onClick={() => {
//                   setQuantity((prev) => Math.max(1, prev - 1));
//                 }}
//                 disabled={quantity <= 1}
//               >
//                 <MinusIcon className="w-4 h-4" />
//               </button>

//               <div>
//                 <span className="w-fit px-2">{quantity}</span>
//               </div>
//               <button
//                 className="h-full w-fit flex justify-center items-center px-3 bg-[#828282]/10 rounded-r-full"
//                 onClick={() => {
//                   setQuantity((prev) =>
//                     Math.min(selectedVariant?.stock, prev + 1)
//                   );
//                 }}
//                 disabled={quantity >= selectedVariant?.stock}
//               >
//                 <PlusIcon className="w-4 h-4" />
//               </button>
//             </div>

//             <AddToCartButton
//               productName={data?.product.productName}
//               onAddToCartClick={handleAddToCart}
//               isDisabled={
//                 !selectedVariant || quantity <= 0 || addToCartMutation.isPending
//               }
//               isAddingToCart={addToCartMutation.isPending}
//             />
//             {/* )} */}
//           </div>
//         </div>
//       </div>

//       {/* PRODUCT FULL DETAILS AND REVIEWS */}
//       <div className="mx-auto max-w-screen-2xl px-5">
//         <Tabs
//           defaultValue="details"
//           className="max-w-screen-2xl mx-auto w-full space-y-5"
//         >
//           <TabsList className="max-w-screen-2xl mx-auto w-full grid grid-cols-2 justify-between items-start bg-gray-200">
//             <TabsTrigger
//               value="details"
//               className="text-lg font-medium capitalize text-center data-[state=active]:text-[#4A90E2] data-[state=active]:bg-white data-[state=active]:border-b-2 border-b-[#4A90E2]"
//             >
//               product details
//             </TabsTrigger>
//             <TabsTrigger
//               value="reviews"
//               className="text-lg font-medium capitalize text-center data-[state=active]:text-[#4A90E2] data-[state=active]:bg-white data-[state=active]:border-b-2 border-b-[#4A90E2]"
//             >
//               Reviews
//             </TabsTrigger>
//           </TabsList>
//           <TabsContent value="details">
//             <div>
//               <p
//                 className={`text-gray-700 leading-relaxed transition-all duration-300`}
//                 style={
//                   isExpanded
//                     ? {}
//                     : {
//                         display: "-webkit-box",
//                         WebkitLineClamp: 3,
//                         WebkitBoxOrient: "vertical",
//                         overflow: "hidden",
//                       }
//                 }
//               >
//                 {parse(data?.product.description || "")}
//               </p>

//               <button
//                 onClick={toggleReadMore}
//                 className="mt-2 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
//               >
//                 {isExpanded ? (
//                   <>
//                     Show Less <ChevronUp size={16} className="ml-1" />
//                   </>
//                 ) : (
//                   <>
//                     Read More <ChevronDown size={16} className="ml-1" />
//                   </>
//                 )}
//               </button>
//             </div>
//           </TabsContent>
//           <TabsContent value="reviews">
//             {data?.product.reviews.length > 0 ? (
//               <div className="grid grid-cols-2 items-stretch justify-start space-x-5">
//                 {data?.product.reviews.map((review: any) => (
//                   <div
//                     key={review.id}
//                     className="w-full p-4 border rounded-lg border-gray-300 bg-white shadow-sm"
//                   >
//                     <div className="flex flex-col-reverse items-start justify-start space-y-2 mb-2">
//                       <span className="font-semibold">
//                         {getFirstName(review.user.name)}{" "}
//                         {getLastName(review.user.name)}.
//                       </span>
//                       <span className="text-yellow-500 text-3xl">
//                         {"★".repeat(review.rating)}
//                         {"☆".repeat(5 - review.rating)}
//                       </span>
//                     </div>
//                     <p className="text-gray-700">"{review.comment}"</p>

//                     <p className="text-gray-500 text-sm mt-2">
//                       Posted on{" "}
//                       {new Date(review.createdAt).toLocaleDateString("en-US", {
//                         year: "numeric",
//                         month: "long",
//                         day: "numeric",
//                       })}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="flex flex-col items-start justify-start space-y-5">
//                 <h3 className="text-xl font-semibold">Customer Reviews</h3>
//                 <p className="text-gray-600">
//                   No reviews yet. Be the first to review this product!
//                 </p>
//               </div>
//             )}
//             {/* Placeholder for reviews component */}
//             <div className="flex flex-col items-start justify-start space-y-5">
//               <h3 className="text-xl font-semibold">Customer Reviews</h3>
//               <p className="text-gray-600">
//                 No reviews yet. Be the first to review this product!
//               </p>
//               {/* Add review form or component here */}
//               <div className="w-full max-w-md">
//                 <Label htmlFor="review" className="block mb-2">
//                   Write a Review
//                 </Label>
//                 <textarea
//                   id="review"
//                   rows={4}
//                   className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   placeholder="Share your thoughts about this product..."
//                 ></textarea>
//                 <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
//                   Submit Review
//                 </button>
//               </div>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>

//       <div className="mt-5">
//         {/* <RelatedProducts
//           tag={data?.product.productTag[0]}
//           name={data?.product.productName as string}
//         /> */}
//       </div>
//       <div className="mt-5">{/* <RecentlyViewed /> */}</div>
//     </div>
//   );
// };

// export default ProductDetails;

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

  const { data, error, isLoading } = useSWR(`/api/products/${slug}`, fetcher);
  const product = data?.product || null;

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
    if (product?.variants?.length > 0 && !selectedVariantId) {
      const firstAvailable =
        product.variants.find((v: ProductVariant) => v.quantity > 0) ||
        product.variants[0];
      setSelectedVariantId(firstAvailable.id);
    }
  }, [product, selectedVariantId]);

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
