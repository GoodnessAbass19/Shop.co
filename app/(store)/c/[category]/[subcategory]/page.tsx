import React from "react";
import { Metadata } from "next";

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
      {subcategory}
      SubCategoryPage Lorem, ipsum dolor sit amet consectetur adipisicing elit.
      Nesciunt quas sequi quae minus itaque velit vitae provident voluptatibus
      nostrum dignissimos quo voluptatem, ipsa perspiciatis at ad ut,
      asperiores, a quibusdam.
    </section>
  );
};

export default SubCategoryPage;
