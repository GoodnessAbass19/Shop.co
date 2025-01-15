import { Product } from "@/types";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import Image from "next/image";
import Link from "next/link";

const ProductCard = ({
  item,
  loading,
}: {
  item: Product;
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

    return percentage.toFixed(0); // Returns the result rounded to 2 decimal places
  }

  return (
    <Link
      href={`/products/${item.slug}`}
      className="w-full rounded-md h-full overflow-hidden"
    >
      {/* {item.images[0]?.url && ( */}
      <Image
        src={
          loading
            ? "https://via.placeholder.com/200"
            : `${item?.images[0]?.url}`
        }
        alt={item.productName}
        blurDataURL="https://via.placeholder.com/200"
        width={500}
        height={500}
        className="object-cover object-center rounded-md h-[260px]"
      />
      {/* )} */}
      <h2 className="font-semibold text-base capitalize text-start font-sans">
        {item.productName}
      </h2>
      <div className="space-y-2">
        <span className="text-lg font-semibold">
          {formatCurrencyValue(item.discountedPrice || item.price)}
        </span>

        {item.discountedPrice && (
          <span className="line-through text-sm text-gray-500 decoration-gray-500 ml-2">
            {formatCurrencyValue(item.price)}
          </span>
        )}
      </div>
      <span className="font-light text-sm text-center text-black bg-gray-400 rounded-lg p-1 absolute top-1 right-1">
        -
        {percentageDifference(
          // @ts-ignore
          item.price,
          item.discountedPrice
        )}
        %
      </span>
    </Link>
  );
};

export default ProductCard;
