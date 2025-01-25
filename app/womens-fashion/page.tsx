import FilterModal from "@/components/ui/FilterModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CategoryProducts from "@/components/products/CategoryProducts";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Women's fashion`,
    description: "Women fashion wears",
  };
}

const WomenFashionPage = () => {
  return (
    <div className="mt-5 max-w-screen-xl mx-auto px-2">
      <Breadcrumb className="md:block hidden pb-5">
        <BreadcrumbList className="dark:text-white text-black">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/"
              className="text-xs md:text-sm font-normal font-sans"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize text-xs md:text-sm font-normal font-sans">
              women's fashion
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-5 justify-between items-start gap-5">
        <div className="col-span-1 py-5 md:block hidden">
          <FilterModal />
        </div>
        <div className="col-span-4 w-full">
          <CategoryProducts title="women's fashion" category="womens-fashion" />
        </div>
      </div>
    </div>
  );
};

export default WomenFashionPage;
