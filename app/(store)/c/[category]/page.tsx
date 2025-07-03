import React from "react";
import { Metadata } from "next";
import Category from "@/components/category/Category";

type Params = { category: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${category}`,
  };
}

const CategoryPage = async ({ params }: { params: Params }) => {
  const { category } = await params;

  return (
    <section className="max-w-screen-xl mx-auto mt-10">
      <Category param={category} />
    </section>
  );
};

export default CategoryPage;
