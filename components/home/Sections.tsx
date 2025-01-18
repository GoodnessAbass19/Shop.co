"use client";

import { GET_PRODUCTS_BY_TAGS } from "@/lib/query";
import { ProductData, productTags } from "@/types";
import { useQuery } from "@apollo/client";
import ProductCard from "../products/productCard";
import { Button } from "../ui/button";
import Link from "next/link";

const Sections = ({
  title,
  tag,
  first,
  href,
}: {
  title: string;
  tag: any;
  first: number;
  href: string;
}) => {
  const { data, loading, error } = useQuery<ProductData>(GET_PRODUCTS_BY_TAGS, {
    variables: { tag: tag, first: first },
    notifyOnNetworkStatusChange: true,
  });
  // if (loading) return null;
  // if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="max-w-screen-xl mx-auto py-5 px-2 space-y-5">
      <h2 className="uppercase text-center text-4xl font-extrabold">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 justify-between items-stretch">
        {data?.products.map((item) => (
          <ProductCard key={item.id} item={item} loading={loading} />
        ))}
      </div>

      {!loading && (
        <div className="flex justify-center items-center w-[200px] mx-auto">
          <Link
            href={`/${href}`}
            className="text-sm font-medium capitalize text-center rounded-full p-2 border border-black/50 w-full"
          >
            view all
          </Link>
        </div>
      )}
    </div>
  );
};

export default Sections;
