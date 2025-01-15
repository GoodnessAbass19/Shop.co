import Banner from "@/components/home/Banner";
import Product from "@/components/home/Product";
import Sections from "@/components/home/Sections";
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
        first={10}
      />
      <Sections title={"top deals"} tag={productTags.topDeals} first={10} />
    </div>
  );
}
