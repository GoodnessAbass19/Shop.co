import React from "react";
import { Metadata } from "next";
import SubCategory from "@/components/category/SubCategory";

type Params = { subcategory: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { subcategory } = await params;
  return {
    title: `${subcategory}`,
  };
}

const SubCategoryPage = async ({ params }: { params: Params }) => {
  const { subcategory } = await params;

  return (
    <section className="max-w-screen-xl mx-auto mt-10">
      <SubCategory param={subcategory} />
    </section>
  );
};

export default SubCategoryPage;
