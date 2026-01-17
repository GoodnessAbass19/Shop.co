import SubSubCategory from "@/components/category/SubSubCategory";
import { Metadata } from "next";
import React from "react";

interface Props {
  params: Promise<{ subsubcategory: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subsubcategory: string }>;
}): Promise<Metadata> {
  const { subsubcategory } = await params;
  return {
    title: `${subsubcategory}`,
  };
}

const page = async ({
  params,
}: {
  params: Promise<{ subsubcategory: string }>;
}) => {
  const { subsubcategory } = await params;
  return (
    <section className="max-w-screen-xl mx-auto mt-10">
      <SubSubCategory param={subsubcategory} />
    </section>
  );
};

export default page;
