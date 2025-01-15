import { Separator } from "./separator";
import { AdjustmentsVerticalIcon } from "@heroicons/react/24/solid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "./button";
import { ChevronsUpDown } from "lucide-react";
import { ProductSizes } from "@/types";
import { Checkbox } from "./checkbox";

const FilterModal = () => {
  return (
    <div className="w-full min-h-screen bg-[#000000]/5 dark:bg-white text-black rounded-lg p-3 space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold capitalize text-start">filter</h3>
        <AdjustmentsVerticalIcon className="w-6 h-6 text-black" />
      </div>

      <Separator className="bg-black" />

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between space-x-4 w-full">
          <h4 className="text-lg font-semibold capitalize">sizes</h4>
          <Button variant="ghost" size="sm">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
        {ProductSizes.map((item, idx) => (
          <CollapsibleContent
            key={idx}
            className="flex flex-row-reverse items-center space-x-2 justify-between w-full space-y-2"
          >
            <Checkbox id="sizes" />
            <label
              htmlFor="sizes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
            >
              {item}
            </label>
          </CollapsibleContent>
        ))}
      </Collapsible>
    </div>
  );
};

export default FilterModal;
