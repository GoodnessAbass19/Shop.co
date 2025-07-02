import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "../ui/button";
import { AlignJustify, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  subSubCategories: SubSubCategory[];
}

interface SubSubCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

const fetchCategories = async (): Promise<ProductCategory[]> => {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "Failed to fetch seller dashboard data."
    );
  }
  return res.json();
};

const MobileMenu = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });
  const [activeCategory, setActiveCategory] = useState<
    ProductCategory | undefined
  >(undefined);

  React.useEffect(() => {
    if (categories && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

  return (
    <Drawer>
      <DrawerTrigger asChild className="">
        <AlignJustify className="w-5 h-5 font-bold" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex justify-between items-center">
          <DrawerTitle className="text-base font-semibold capitalize">
            All Categories
          </DrawerTitle>
          <DrawerClose>
            <Button variant="default">
              <X className="w-6 h-6 font-bold" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div>
          {categories?.map((category) => (
            <div
              key={category.name}
              className={cn(
                "py-2 px-1.5 rounded-md cursor-pointer hover:bg-muted text-base font-semibold font-sans capitalize flex justify-between items-center"
              )}
            >
              {category.name}
              <ChevronRight className="w-5 h-5" />
            </div>
          ))}
        </div>

        {/* <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
};

export default MobileMenu;
