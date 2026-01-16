import { formatCurrencyValue } from "@/utils/format-currency-value";
import { SkeletonCard } from "../ui/SkeletonCard";
import { Product, ProductVariant } from "@prisma/client";
import {
  calculatePercentageChange,
  formatPercentage,
  isSaleActive,
} from "@/lib/utils";
import Link from "next/link";
import WishlistButton from "../ui/wishlistButton";

type ProductData = Product & {
  variants: ProductVariant[];
  images: { url: string }[];
};

const ProductCard = ({
  item,
  loading,
}: {
  item: ProductData;
  loading: boolean;
}) => {
  if (loading) {
    return <div>{loading && <SkeletonCard />}</div>;
  }

  const firstVariant = item?.variants?.[0];
  const isOnSale =
    firstVariant &&
    isSaleActive(firstVariant.saleStartDate, firstVariant.saleEndDate);
  const currentPrice = isOnSale ? firstVariant.salePrice : firstVariant?.price;

  return (
    <div className="group flex flex-col rounded-xl border border-[#cfd9e7] dark:border-gray-700 bg-white dark:bg-surface-dark overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        <Link href={`/products/${item?.slug}`} className="block w-full h-full">
          <img
            src={
              item?.images?.[0]?.url || "https://via.placeholder.com/500x667"
            }
            alt={item?.name || "product"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Wishlist Button */}
        <WishlistButton
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform active:scale-90 hover:bg-white"
          productId={item?.id}
          name={item?.name}
        />

        {/* Sale Badge */}
        {isOnSale && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-sm z-10">
            {/* <span className="bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider rounded-md shadow-sm"> */}
            {formatPercentage(
              calculatePercentageChange(
                item.variants[0].price,
                item.variants[0].salePrice
              ),
              0,
              true
            )}
            {/* </span> */}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2 flex flex-col gap-2 flex-1">
        <Link href={`/products/${item?.slug}`}>
          <h3 className="text-[#0d131b] dark:text-white text-sm font-semibold line-clamp-2 min-h-[2.5em]">
            {item?.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#0d131b] dark:text-white font-bold text-lg">
              {formatCurrencyValue(currentPrice)}
            </span>
            {isOnSale && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrencyValue(firstVariant.price)}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
