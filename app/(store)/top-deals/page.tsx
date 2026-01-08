import { Metadata } from "next";
import ProductListingPage from "@/components/products/ProductListingPage";
import { productTags } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Top deals`,
    description: "top deals",
  };
}

const TopDealsPage = () => {
  return (
    <ProductListingPage
      pageTitle="top deals"
      filter={{ title: "top deals", tag: productTags.topDeals }}
    />
  );
};

export default TopDealsPage;
