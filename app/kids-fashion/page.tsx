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
    title: `Kid's fashion`,
    description: "shop for your kid's clothing",
  };
}

const KidsFashionPage = () => {
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
              kid's fashion
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid md:grid-cols-5 justify-between items-start gap-5">
        <div className="md:col-span-1 py-5 hidden md:block">
          <FilterModal />
        </div>
        <div className="md:col-span-4 w-full">
          <CategoryProducts title="kid's fashion" category="kids-fashion" />
        </div>
      </div>
    </div>
  );
};

export default KidsFashionPage;
