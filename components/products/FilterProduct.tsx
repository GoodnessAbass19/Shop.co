"use client";

import { GET_PRODUCT_BY_SIZES, GET_PRODUCTS_BY_TAGS } from "@/lib/query";
import { ProductData, productTags } from "@/types";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import ProductCard from "./productCard";

// GraphQL Enum Mapping
const VALID_SIZES = ["XL", "MEDIUM", "LARGE", "XXL"];

const FilterProduct = ({ title, tag }: { title: string; tag: any }) => {
  const param = useSearchParams();
  const rawSizes = param.get("size")?.split(",") || [];

  // Transform URL parameters into valid GraphQL enums
  const sizes = rawSizes.map((size) => size.toLowerCase()); // Convert to uppercase

  // Use the appropriate query and variables
  const isSizeFilterActive = sizes.length > 0;

  const { data, loading, error } = useQuery<ProductData>(
    isSizeFilterActive ? GET_PRODUCT_BY_SIZES : GET_PRODUCTS_BY_TAGS,
    {
      variables: isSizeFilterActive
        ? { size: sizes, tag: tag }
        : { tag: tag, first: 15 }, // Default to "newArrivals" tag if no sizes
      skip: false, // Ensure the query always runs
      notifyOnNetworkStatusChange: true,
    }
  );

  // if (loading) return <p>Loading...</p>;
  // if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 capitalize">{title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-between items-stretch">
        {data?.products.map((product) => (
          <ProductCard key={product.id} item={product} loading={loading} />
        ))}
      </div>
    </div>
  );
};

export default FilterProduct;
