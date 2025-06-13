// import { Product } from "@/types";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import Image from "next/image";
import Link from "next/link";
import { SkeletonCard } from "../ui/SkeletonCard";
interface ProductCardItem {
  id: string;
  slug: string;
  productName: string; // From API's mapping of product.name
  images: { url: string }[]; // From API's mapping of product.images
  price: number; // This is the 'lowestPrice' from API
  discountedPrice?: number | null; // The 'calculatedDiscountedPrice' from API
  discountPercentage?: number | null; // The 'discountPercentage' from API
}

const ProductCard = ({
  item,
  loading,
}: {
  item: ProductCardItem;
  loading: boolean;
}) => {
  function percentageDifference(num1: number | 0, num2: number | 0) {
    if (num1 === 0 && num2 === 0) {
      return 0; // No difference if both numbers are zero
    }

    // Use the absolute difference divided by the average of the two numbers
    const difference = Math.abs(num1 - num2);
    const average = (Math.abs(num1) + Math.abs(num2)) / 2;

    // Calculate percentage difference
    const percentage = (difference / average) * 100;

    return Math.ceil(percentage); // Round up to the nearest whole number
  }

  if (loading) {
    return <div>{loading && <SkeletonCard />}</div>;
  }

  return (
    <Link
      href={`/products/${item?.slug}`}
      className="w-full h-full overflow-hidden relative shadow-md"
    >
      {/* {item.images[0]?.url && ( */}
      <Image
        src={
          loading
            ? "https://via.placeholder.com/200"
            : `${item?.images?.[0]?.url}`
        }
        alt={item?.productName || "product"}
        blurDataURL="https://via.placeholder.com/200"
        width={500}
        height={500}
        className="object-cover object-center rounded-md h-[260px]"
      />
      {/* )} */}
      <h2 className="font-semibold text-base capitalize text-start font-sans line-clamp-1">
        {item?.productName}
      </h2>
      <div className="space-y-2">
        <span className="text-lg font-semibold">
          {formatCurrencyValue(item?.discountedPrice || item?.price)}
        </span>

        {item?.discountedPrice && (
          <span className="line-through text-sm text-gray-500 decoration-gray-500 ml-2 dark:text-white dark:decoration-white">
            {formatCurrencyValue(item?.price)}
          </span>
        )}
        {item?.discountedPrice && (
          <span className="font-light text-sm text-center text-[#F4F4F4] bg-black/40 rounded-full p-1.5 px-2 ml-3 absolute top-1 right-1">
            -{item?.discountPercentage}
            {/* {percentageDifference(
              // @ts-ignore
              item?.price,
              item?.discountedPrice
            )} */}
            %
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
