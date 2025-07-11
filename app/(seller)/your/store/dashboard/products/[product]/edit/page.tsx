import { EditProductForm } from "@/components/seller/EditProductForm";
import { Metadata } from "next";
import React from "react";

type Params = { product: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { product } = await params;
  return {
    title: `${product}`,
  };
}

const page = async ({ params }: { params: Params }) => {
  const { product } = await params;

  return <EditProductForm productId={product} />;
};

export default page;
