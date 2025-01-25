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
    kid: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kid } = params;
  return {
    title: `${kid}`,
    // description: project.description,
    metadataBase: new URL("https://media.graphassets.com"),
  };
}

const KidsSubcategoryPage = async ({ params }: Props) => {
  const { kid } = await params;

  const textWithHyphen = kid;
  const textWithoutHyphen = textWithHyphen.replace(/-/g, " ");

  return (
    <div>
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
                href="/kids-fashion"
                className="dark:text-white text-black capitalize text-sm font-sans line-clamp-1"
              >
                kid's fashion
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize text-xs md:text-sm font-normal font-sans">
                {kid}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-5 justify-between items-start gap-5">
          <div className="col-span-1 py-5 hidden md:block">
            <FilterModal />
          </div>
          <div className="col-span-4 w-full">
            <SubcategoryProduct
              title={`${textWithoutHyphen}`}
              category="kids-fashion"
              subcategory={kid}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsSubcategoryPage;
