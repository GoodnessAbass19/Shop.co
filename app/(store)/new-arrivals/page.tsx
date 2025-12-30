import { productTags } from "@/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import FilterProduct from "@/components/products/FilterProduct";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `New arrivals`,
    description: "",
  };
}

const NewArrivalPage = () => {
  return (
    <div className="mt-5 max-w-screen-xl mx-auto px-4">
      <Breadcrumb className="md:block hidden pb-5">
        <BreadcrumbList className="dark:text-white text-black">
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/"
              className="text-xs md:text-sm font-medium font-sans"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize text-xs md:text-sm font-medium font-sans">
              new arrivals
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid md:grid-cols-5 justify-between items-start gap-5">
        {/* <div className="md:col-span-1 py-5 hidden md:block">
          <FilterModal />
        </div> */}
        <div className="md:col-span-5 w-full">
          <FilterProduct title="new arrivals" tag={productTags.newArrivals} />
        </div>

        {/* <FilterProduct /> */}
      </div>
    </div>
  );
};

export default NewArrivalPage;
