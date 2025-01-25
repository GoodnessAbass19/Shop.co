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
    women: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { women } = await params;
  return {
    title: `${women}`,
    // description: project.description,
    metadataBase: new URL("https://media.graphassets.com"),
  };
}

const SubCategoryPage = async ({ params }: Props) => {
  const { women } = await params;

  const textWithHyphen = women;
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
              href="/womens-fashion"
              className="dark:text-white text-black capitalize text-sm font-sans line-clamp-1"
            >
              women's fashion
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize text-xs md:text-sm font-normal font-sans">
              womens {women}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-5 justify-between items-start gap-5">
        <div className="col-span-1 py-5 md:block hidden">
          <FilterModal />
        </div>
        <div className="col-span-4 w-full">
          <SubcategoryProduct
            title={`women's ${textWithoutHyphen}`}
            category="womens-fashion"
            subcategory={women}
          />
        </div>
      </div>
    </div>
  );
};

export default SubCategoryPage;
