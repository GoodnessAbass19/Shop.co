import ProductDetails from "@/components/products/Details";
import { Metadata } from "next";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug}`,
    // description: project.description,
    metadataBase: new URL("https://media.graphassets.com"),
  };
}

const SingleProductPage = async ({ params }: { params: Params }) => {
  const { slug } = await params;
  return (
    <div className="max-w-screen-xl mx-auto mt-10">
      <ProductDetails slug={slug} />
    </div>
  );
};

export default SingleProductPage;
