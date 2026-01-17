import React from "react";
import { Metadata } from "next";
import Category from "@/components/category/Category";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${category}`,
  };
}

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ category: string }>;
}) => {
  const { category } = await params;

  return (
    <section className="max-w-screen-xl mx-auto mt-6">
      <Category param={category} />
    </section>
  );
};

export default CategoryPage;
