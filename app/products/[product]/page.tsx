import ProductDetails from "@/components/products/Details";
import { Metadata } from "next";

type Params = { product: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { product } = await params;
  return {
    title: `${product}`,
    // description: project.description,
    metadataBase: new URL("https://media.graphassets.com"),
  };
}

const SingleProductPage = async ({ params }: { params: Params }) => {
  const { product } = await params;
  return (
    <div className="max-w-screen-xl mx-auto mt-10">
      <ProductDetails slug={product} />
    </div>
  );
};

export default SingleProductPage;
