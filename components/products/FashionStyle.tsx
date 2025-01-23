"use client";

import {
  GET_PRODUCT_BY_FASHIONSTYLE,
  GET_PRODUCT_BY_FASHIONSTYLE_AND_SIZES,
  GET_PRODUCT_BY_SUBCATEGORY,
  GET_PRODUCT_BY_SUBCATEGORY_AND_SIZES,
} from "@/lib/query";
import { ProductData } from "@/types";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import ProductCard from "./productCard";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Pagination from "../ui/Pagination";

const FashionStyle = ({
  title,
  subcategory,
}: {
  title: string;
  subcategory: string;
}) => {
  const param = useSearchParams();
  const rawSizes = param.get("size")?.split(",") || [];
  const page = param.get("page");
  const p = page ? parseInt(page) : 1;

  // Transform URL parameters into valid GraphQL enums
  const sizes = rawSizes.map((size) => size.toLowerCase()); // Convert to uppercase

  // Use the appropriate query and variables
  const isSizeFilterActive = sizes.length > 0;

  const { data, loading, error } = useQuery<ProductData>(
    isSizeFilterActive
      ? GET_PRODUCT_BY_FASHIONSTYLE_AND_SIZES
      : GET_PRODUCT_BY_FASHIONSTYLE,
    {
      variables: isSizeFilterActive
        ? {
            size: sizes,
            first: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
            subCategory: subcategory,
          }
        : {
            subCategory: subcategory,
            first: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
          },
      skip: false, // Ensure the query always runs
      notifyOnNetworkStatusChange: true,
    }
  );

  return (
    <div>
      <h1 className="text-xl font-medium mb-4 capitalize text-ellipsis">
        {title}
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-between items-stretch">
        {data?.products.map((product) => (
          <ProductCard key={product.id} item={product} loading={loading} />
        ))}
      </div>

      <div className="mt-10">
        <Pagination count={data?.products.length as number} page={p} />
      </div>
    </div>
  );
};

export default FashionStyle;
