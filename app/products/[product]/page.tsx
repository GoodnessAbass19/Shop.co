import ProductDetails from "@/components/products/Details";

type Params = { product: string };

const SingleProductPage = async ({ params }: { params: Params }) => {
  const { product } = await params;
  return (
    <div className="max-w-screen-xl mx-auto mt-10">
      <ProductDetails slug={product} />
    </div>
  );
};

export default SingleProductPage;
