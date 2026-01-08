import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import FilterProduct from "@/components/products/FilterProduct";

interface FilterProps {
  title?: string;
  url?: string;
  tag?: string;
}

interface ProductListingPageProps {
  pageTitle: string;
  description?: string;
  filter?: FilterProps;
}

const ProductListingPage: React.FC<ProductListingPageProps> = ({
  pageTitle,
  description,
  filter,
}) => {
  return (
    <div className="mt-5 max-w-screen-xl mx-auto px-2">
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
              {pageTitle}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* <div className="grid md:grid-cols-5 justify-between items-start gap-5">
        <div className="md:col-span-5 w-full"> */}
      <FilterProduct
        title={filter?.title || pageTitle}
        url={filter!.url!}
        tag={filter!.tag}
      />
      {/* </div>
      </div> */}
    </div>
  );
};

export default ProductListingPage;
