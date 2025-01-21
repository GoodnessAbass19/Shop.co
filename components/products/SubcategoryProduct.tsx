"use client";

import {
  GET_PRODUCT_BY_SUBCATEGORY,
  GET_PRODUCT_BY_SUBCATEGORY_AND_SIZES,
} from "@/lib/query";
import { ProductData } from "@/types";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import ProductCard from "./productCard";

const SubcategoryProduct = ({
  title,
  category,
  subcategory,
}: {
  title: string;
  category: string;
  subcategory: string;
}) => {
  const param = useSearchParams();
  const rawSizes = param.get("size")?.split(",") || [];

  // Transform URL parameters into valid GraphQL enums
  const sizes = rawSizes.map((size) => size.toLowerCase()); // Convert to uppercase

  // Use the appropriate query and variables
  const isSizeFilterActive = sizes.length > 0;

  const { data, loading, error } = useQuery<ProductData>(
    isSizeFilterActive
      ? GET_PRODUCT_BY_SUBCATEGORY_AND_SIZES
      : GET_PRODUCT_BY_SUBCATEGORY,
    {
      variables: isSizeFilterActive
        ? {
            size: sizes,
            category: category,
            first: 24,
            subCategory: subcategory,
          }
        : { category: category, subCategory: subcategory, first: 24 },
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

export default SubcategoryProduct;
