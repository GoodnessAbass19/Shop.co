import ProductDetails from "@/components/products/Details";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug}`,
  };
}

const SingleProductPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  return (
    <div className="max-w-screen-xl mx-auto mt-3">
      <ProductDetails slug={slug} />
    </div>
  );
};

export default SingleProductPage;
