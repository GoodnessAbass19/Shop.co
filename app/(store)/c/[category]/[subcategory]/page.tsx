import React from "react";
import { Metadata } from "next";
import SubCategory from "@/components/category/SubCategory";

interface Props {
  params: Promise<{ subcategory: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}): Promise<Metadata> {
  const { subcategory } = await params;
  return {
    title: `${subcategory}`,
  };
}

const SubCategoryPage = async ({
  params,
}: {
  params: Promise<{ subcategory: string }>;
}) => {
  const { subcategory } = await params;

  return (
    <section className="max-w-screen-xl mx-auto mt-10">
      <SubCategory param={subcategory} />
    </section>
  );
};

export default SubCategoryPage;
