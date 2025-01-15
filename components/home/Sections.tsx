"use client";

import { GET_PRODUCTS_BY_TAGS } from "@/lib/query";
import { ProductData, productTags } from "@/types";
import { useQuery } from "@apollo/client";
import ProductCard from "../products/productCard";

const Sections = ({
  title,
  tag,
  first,
}: {
  title: string;
  tag: any;
  first: number;
}) => {
  const { data, loading, error } = useQuery<ProductData>(GET_PRODUCTS_BY_TAGS, {
    variables: { tag: tag, first: first },
    notifyOnNetworkStatusChange: true,
  });
  // if (loading) return <p>Loading...</p>;
  // if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="max-w-screen-2xl mx-auto py-5 px-2 space-y-5">
      <h2 className="uppercase text-center text-4xl font-extrabold">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 justify-between items-stretch">
        {data?.products.map((item) => (
          <ProductCard key={item.id} item={item} loading={loading} />
        ))}
      </div>
    </div>
  );
};

export default Sections;
