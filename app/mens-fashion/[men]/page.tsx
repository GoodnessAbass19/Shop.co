import SubcategoryProduct from "@/components/products/SubcategoryProduct";
import FilterModal from "@/components/ui/FilterModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Props = {
  params: {
    men: string;
  };
};

const SubCategoryPage = async ({ params }: Props) => {
  const slug = await params.men;

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
            <BreadcrumbLink
              href="/mens-fashion"
              className="dark:text-white text-black capitalize text-sm font-sans line-clamp-1"
            >
              men's fashion
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize text-xs md:text-sm font-normal font-sans">
              mens {params.men}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-5 justify-between items-start gap-5">
        <div className="col-span-1 py-5">
          <FilterModal />
        </div>
        <div className="col-span-4 w-full">
          <SubcategoryProduct
            title={`men's ${slug}`}
            category="mens-fashion"
            subcategory={slug}
          />
        </div>
      </div>
    </div>
  );
};

export default SubCategoryPage;
