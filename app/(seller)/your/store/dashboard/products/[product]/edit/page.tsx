import { EditProductForm } from "@/components/seller/EditProductForm";
import { Metadata } from "next";
import React from "react";

interface Props {
  params: Promise<{ product: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  return {
    title: `${product}`,
  };
}

const page = async ({ params }: { params: Promise<{ product: string }> }) => {
  const { product } = await params;

  return <EditProductForm productId={product} />;
};

export default page;
