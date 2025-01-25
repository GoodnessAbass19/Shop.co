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
import { Metadata } from "next";

type Props = {
  params: {
    men: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { men } = params;
  return {
    title: `${men}`,
    // description: project.description,
    metadataBase: new URL("https://media.graphassets.com"),
  };
}

const SubCategoryPage = async ({ params }: Props) => {
  const { men } = await params;

  const textWithHyphen = men;
  const textWithoutHyphen = textWithHyphen.replace(/-/g, " ");

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
              mens {men}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid md:grid-cols-5 justify-between items-start gap-5">
        <div className="md:col-span-1 py-5 hidden md:block">
          <FilterModal />
        </div>
        <div className="md:col-span-4 w-full">
          <SubcategoryProduct
            title={`men's ${textWithoutHyphen}`}
            category="mens-fashion"
            subcategory={men}
          />
        </div>
      </div>
    </div>
  );
};

export default SubCategoryPage;
