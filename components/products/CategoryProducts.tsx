"use client";

import {
  GET_PRODUCT_BY_CATEGORY,
  GET_PRODUCT_BY_CATEGORY_AND_SIZES,
} from "@/lib/query";
import { ProductData } from "@/types";
import { useQuery } from "@apollo/client";
import ProductCard from "./productCard";
import { useSearchParams } from "next/navigation";

const CategoryProducts = ({
  title,
  category,
}: {
  title: string;
  category: string;
}) => {
  const param = useSearchParams();
  const rawSizes = param.get("size")?.split(",") || [];

  // Transform URL parameters into valid GraphQL enums
  const sizes = rawSizes.map((size) => size.toLowerCase()); // Convert to uppercase

  // Use the appropriate query and variables
  const isSizeFilterActive = sizes.length > 0;

  const { data, loading, error } = useQuery<ProductData>(
    isSizeFilterActive
      ? GET_PRODUCT_BY_CATEGORY_AND_SIZES
      : GET_PRODUCT_BY_CATEGORY,
    {
      variables: isSizeFilterActive
        ? { size: sizes, category: category, first: 24 }
        : { category: category, first: 24 },
      skip: false, // Ensure the query always runs
      notifyOnNetworkStatusChange: true,
    }
  );
  if (error) {
    return <p>No result</p>;
  }

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
    </div>
  );
};

export default CategoryProducts;
