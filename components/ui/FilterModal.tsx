"use client";
import { Separator } from "./separator";
import { AdjustmentsVerticalIcon } from "@heroicons/react/24/solid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "./button";
import { ChevronsUpDown } from "lucide-react";
import { ProductData, ProductSizes } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";

const FilterModal = () => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const FormSchema = z.object({
    sizes: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: "You have to select at least one genre.",
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sizes: [],
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const genreIds = data.sizes; // Extract the genre IDs directly
    const values = { input: genreIds }; // Create the values object
    const inputValuesString = Object.values(values.input).join(","); // Join IDs as comma-separated string
    router.push(`${window.location.pathname}?size=${inputValuesString}`, {
      scroll: true,
    });
    router.refresh();
    form.reset();
  }

  return (
    <div className="w-full min-h-screen bg-[#000000]/5 dark:bg-white text-black rounded-lg p-3 space-y-5">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-xl font-semibold capitalize text-start">filter</h3>
        <AdjustmentsVerticalIcon className="w-6 h-6 text-black" />
      </div>

      <Separator className="bg-black" />

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between space-x-2 w-full">
          <h4 className="text-lg font-semibold capitalize">sizes</h4>
          {/* <Button variant="ghost" size="lg" className="inline-flex"> */}
          <ChevronsUpDown className="h-4 w-4" onClick={() => !isOpen} />
          {/* </Button> */}
        </CollapsibleTrigger>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="sizes"
              render={() => (
                <FormItem className="grid grid-cols-1 gpa-y-5">
                  {ProductSizes.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="sizes"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item}
                            className="flex flex-row space-x-3 space-y-0 justify-between items-center"
                          >
                            <FormLabel className="text-base font-normal">
                              {item}
                            </FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </Collapsible>
    </div>
  );
};

export default FilterModal;
