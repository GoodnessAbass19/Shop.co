"use client";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { SingleProduct } from "@/types";
import { GET_SINGLE_PRODUCT } from "@/lib/query";
import { formatCurrencyValue } from "@/utils/format-currency-value";

const RecentProduct = ({ url }: { url: string }) => {
  function getLastPartOfUrl(url: string) {
    // Split the URL by '/'
    const parts = url.split("/");
    // Return the last part of the array
    return parts[parts.length - 1];
  }
  const slug = getLastPartOfUrl(url);

  const { loading, data } = useQuery<SingleProduct>(GET_SINGLE_PRODUCT, {
    variables: { slug: slug },
    notifyOnNetworkStatusChange: true,
  });

  return (
    <Link
      href={data?.product.slug || ""}
      className="grid text-[rgb(30,30,30)] w-auto max-h-[300px] hover:shadow-md shadow-gray-200 dark:hover:shadow-gray-800 rounded-md p-1.5 dark:bg-black bg-white transition-transform duration-150"
    >
      <div className="w-full grid grid-rows-3">
        <div className="rounded-md overflow-hidden shadow row-span-2 sm:max-w-full max-h-[240px]">
          <div className="w-full h-full">
            <Image
              src={
                data?.product.images[0]?.url || "https://example.com/image1.jpg"
              }
              width={500}
              height={500}
              alt="item"
              className="w-full  object-cover"
              placeholder="blur"
              blurDataURL={
                data?.product.images[0]?.url || "https://example.com/image1.jpg"
              }
              priority
            />
          </div>
        </div>

        <div className="flex flex-col mt-2 text-sm dark:text-white text-black">
          <h4 className=" font-medium text-base">
            <Link
              href={data?.product.slug || "#"}
              className=" capitalize line-clamp-1"
            >
              {data?.product.productName}
            </Link>
          </h4>

          <span className="capitalize font-bold text-sm">
            {formatCurrencyValue(data?.product.price)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default RecentProduct;
