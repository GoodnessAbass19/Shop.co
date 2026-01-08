import { Metadata } from "next";
import ProductListingPage from "@/components/products/ProductListingPage";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `New arrivals`,
    description: "",
  };
}

const NewArrivalPage = () => {
  return (
    <ProductListingPage
      pageTitle="new arrivals"
      filter={{ title: "new arrivals", url: "new-arrivals" }}
    />
  );
};

export default NewArrivalPage;
