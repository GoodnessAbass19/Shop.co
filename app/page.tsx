import Banner from "@/components/home/Banner";
import Product from "@/components/home/Product";
import Sections from "@/components/home/Sections";
import Styles from "@/components/home/Styles";
import { productTags } from "@/types";
import Image from "next/image";

export default function Home() {
  return (
    <div className="mx-auto">
      <Banner />
      {/* <Product /> */}
      <Sections
        title={"new arrivals"}
        tag={productTags.newArrivals}
        first={5}
        href="new-arrivals"
      />
      <Sections
        title={"top deals"}
        tag={productTags.topDeals}
        first={5}
        href="top-deals"
      />

      <Styles />
    </div>
  );
}
