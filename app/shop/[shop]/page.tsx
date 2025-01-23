import FashionStyle from "@/components/products/FashionStyle";
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
    shop: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shop } = params;
  return {
    title: `${shop}`,
    // description: project.description,
    metadataBase: new URL("https://media.graphassets.com"),
  };
}

const page = async ({ params }: Props) => {
  const { shop } = await params;

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
              shop
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize text-xs md:text-sm font-normal font-sans">
              {shop}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-5 justify-between items-start gap-5">
        <div className="col-span-1 py-5">
          <FilterModal />
        </div>
        <div className="col-span-4 w-full">
          <FashionStyle title={shop} subcategory={shop} />
        </div>
      </div>
    </div>
  );
};

export default page;
