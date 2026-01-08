import Banner from "@/components/home/Banner";
import Categories from "@/components/home/Categories";
import Sections from "@/components/home/Sections";

export default function Home() {
  return (
    <div className="mx-auto">
      <Banner />
      <Categories />
      <Sections
        title={"new arrivals"}
        url="/api/products/new-arrivals"
        href="new-arrivals"
      />
      <Sections
        title={"top deals"}
        url="/api/products/top-deals"
        href="top-deals"
      />
    </div>
  );
}
