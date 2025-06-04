import Banner from "@/components/home/Banner";
import Sections from "@/components/home/Sections";
import { productTags } from "@/types";

export default function Home() {
  return (
    <div className="mx-auto">
      <Banner />
      {/* <Product /> */}
      <Sections
        title={"new arrivals"}
        tag={productTags.newArrivals}
        first={15}
        href="new-arrivals"
      />
      <Sections
        title={"top deals"}
        tag={productTags.topDeals}
        first={15}
        href="top-deals"
      />

      {/* <Styles /> */}
    </div>
  );
}
