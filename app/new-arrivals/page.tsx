import Sections from "@/components/home/Sections";
import FilterModal from "@/components/ui/FilterModal";
import { productTags } from "@/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const NewArrivalPage = () => {
  return (
    <div className="mt-5 max-w-screen-2xl mx-auto px-2">
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
      <div className="grid grid-cols-5 justify-between items-start gap-5">
        <div className="col-span-1 py-5">
          <FilterModal />
        </div>
        <div className="col-span-4 w-full">
          <Sections
            title="new arrivals"
            tag={productTags.newArrivals}
            first={20}
          />
        </div>
      </div>
    </div>
  );
};

export default NewArrivalPage;
