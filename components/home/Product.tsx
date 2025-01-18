"use client";

import { GET_PRODUCT } from "@/lib/query";
import { ProductData } from "@/types";
import { useQuery } from "@apollo/client";
import Image from "next/image";
import ProductCard from "../products/productCard";

const Product = () => {
  const { data, loading, error } = useQuery<ProductData>(GET_PRODUCT, {
    variables: { first: 15 },
    notifyOnNetworkStatusChange: true,
  });

  return (
    <div className="max-w-screen-xl mx-auto py-5 px-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 justify-between items-stretch">
      {data?.products.map((product) => (
        <ProductCard item={product} key={product.id} loading={loading} />
      ))}
      {data?.products.map((product) => (
        <ProductCard item={product} key={product.id} loading={loading} />
      ))}
    </div>
  );
};

export default Product;
