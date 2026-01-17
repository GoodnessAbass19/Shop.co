// components/seller/EditDiscountForm.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  CalendarIcon,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  Check,
  XCircle,
} from "lucide-react";
import { useToast } from "@/Hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Discount, Product } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation"; // Import useRouter
import { useSellerStore } from "@/Hooks/use-store-context";

// --- Type Definitions ---
interface DiscountFormData {
  code: string;
  description?: string;
  percentage?: number | "";
  amount?: number | "";
  minOrderAmount?: number | "";
  maxDiscountAmount?: number | "";
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  productIds: string[];
}

// Extended Product type for product selection
type ProductForSelection = Pick<Product, "id" | "name">;

// Extended Discount type for fetching
type DiscountWithProducts = Discount & { products?: ProductForSelection[] };

interface EditDiscountFormProps {
  discountId: string; // The ID of the discount to edit
}

// API functions
const fetchDiscountForEdit = async (
  discountId: string
): Promise<DiscountWithProducts> => {
  const res = await fetch(`/api/store/discounts/${discountId}`); // Assuming you'll create a GET for single discount
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch discount for editing.");
  }
  const data = await res.json();
  return data.discount; // Assuming API returns { discount: DiscountWithProducts }
};

const updateDiscount = async (discountId: string, data: any) => {
  const res = await fetch(`/api/store/discounts/${discountId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update discount.");
  }
  return res.json();
};

// Function to fetch seller's products for selection
const fetchSellerProductsForSelection = async (
  storeId: string
): Promise<ProductForSelection[]> => {
  const res = await fetch(
    `/api/store/products?storeId=${storeId}&select=id,name`
  ); // Assuming API can take select param
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.error || "Failed to fetch products for selection."
    );
  }
  const data = await res.json();
  return data.map((p: any) => ({ id: p.id, name: p.name }));
};

export function EditDiscountForm({ discountId }: EditDiscountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter(); // Initialize useRouter
  const { store } = useSellerStore();
  const { id: storeId } = store;

  // Fetch discount data for editing
  const {
    data: discountData,
    isLoading: isDiscountLoading,
    isError: isDiscountError,
    error: discountError,
  } = useQuery<DiscountWithProducts, Error>({
    queryKey: ["discountForEdit", discountId],
    queryFn: () => fetchDiscountForEdit(discountId),
    enabled: !!discountId, // Only fetch if discountId is available
    staleTime: 0, // Always refetch fresh data for editing
    refetchOnWindowFocus: false,
  });

  // Fetch products for linking
  const {
    data: productsForSelection,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery<ProductForSelection[], Error>({
    queryKey: ["productsForDiscountSelection", storeId],
    queryFn: () => fetchSellerProductsForSelection(storeId),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!storeId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiscountFormData>({
    defaultValues: {
      code: "",
      description: "",
      percentage: "",
      amount: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      startsAt: new Date(),
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: true,
      productIds: [],
    },
    mode: "onBlur",
  });

  const currentProductIds = watch("productIds");
  const currentPercentage = watch("percentage");
  const currentAmount = watch("amount");
  const currentStartsAt = watch("startsAt");
  const currentExpiresAt = watch("expiresAt");

  // Populate form when discountData is loaded
  useEffect(() => {
    if (discountData) {
      reset({
        code: discountData.code,
        description: discountData.description || "",
        percentage:
          discountData.percentage !== null ? discountData.percentage : "",
        amount: discountData.amount !== null ? discountData.amount : "",
        minOrderAmount:
          discountData.minOrderAmount !== null
            ? discountData.minOrderAmount
            : "",
        maxDiscountAmount:
          discountData.maxDiscountAmount !== null
            ? discountData.maxDiscountAmount
            : "",
        startsAt: new Date(discountData.startsAt),
        expiresAt: new Date(discountData.expiresAt),
        isActive: discountData.isActive,
        productIds: discountData.products
          ? discountData.products.map((p) => p.id)
          : [],
      });
    }
  }, [discountData, reset]);

  // Mutation for updating a discount
  const updateDiscountMutation = useMutation({
    mutationFn: (data: {
      discountId: string;
      formData: Partial<DiscountFormData>;
    }) => updateDiscount(data.discountId, data.formData),
    onSuccess: (data) => {
      toast({
        title: "Discount Updated",
        description: `Discount code '${data.discount.code}' updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["sellerDiscounts", storeId] });
      queryClient.invalidateQueries({
        queryKey: ["discountForEdit", discountId],
      }); // Invalidate current discount data
      router.push("/your/store/dashboard/discounts"); // Navigate back to discount list
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update discount.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DiscountFormData) => {
    const payload = {
      ...data,
      percentage: data.percentage === "" ? undefined : Number(data.percentage),
      amount: data.amount === "" ? undefined : Number(data.amount),
      minOrderAmount:
        data.minOrderAmount === "" ? undefined : Number(data.minOrderAmount),
      maxDiscountAmount:
        data.maxDiscountAmount === ""
          ? undefined
          : Number(data.maxDiscountAmount),
    };

    updateDiscountMutation.mutate({
      discountId: discountId,
      formData: payload,
    });
  };

  const isPending =
    isDiscountLoading || productsLoading || updateDiscountMutation.isPending;

  // Helper to get error message for a given field path
  const getErrorMessage = (path: string) => {
    const error = errors;
    const errorObject = path.split(".").reduce((acc, part) => {
      return (
        acc &&
        (acc[parseInt(part)] !== undefined ? acc[parseInt(part)] : acc[part])
      );
    }, error as any);
    return errorObject?.message;
  };

  if (isDiscountLoading || productsLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  if (isDiscountError) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  if (productsError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading products for selection: {productsError}. Please refresh.
      </div>
    );
  }

  if (!discountData) {
    return (
      <div className="text-gray-600 text-center py-8">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-semibold">Discount not found.</p>
        <Button
          onClick={() => router.push("/your/store/dashboard/discounts")}
          className="mt-4"
        >
          Back to Discounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Edit Discount: {discountData?.code}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Discount Code */}
        <div>
          <Label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Discount Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="e.g., SUMMER20, FREESHIP"
            {...register("code", { required: "Discount code is required." })}
            className={cn(
              "w-full px-4 py-2 border rounded-md",
              getErrorMessage("code") && "border-red-500"
            )}
            disabled={isPending}
          />
          {getErrorMessage("code") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("code")}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Brief description of the discount..."
            rows={2}
            {...register("description")}
            className="w-full px-4 py-2 border rounded-md resize-y"
            disabled={isPending}
          />
        </div>

        {/* Discount Type: Percentage or Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="percentage"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Percentage Off (%)
            </Label>
            <Input
              id="percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 15.00"
              {...register("percentage", {
                valueAsNumber: true,
                validate: (value) => {
                  if (value === "" && currentAmount === "")
                    return "Either percentage or amount must be provided.";
                  if (value !== "" && (value! < 0 || value! > 100))
                    return "Percentage must be between 0 and 100.";
                  if (value !== "" && currentAmount !== "")
                    return "Cannot have both percentage and amount.";
                  return true;
                },
              })}
              className={cn(
                "w-full px-4 py-2 border rounded-md",
                getErrorMessage("percentage") && "border-red-500"
              )}
              disabled={
                isPending ||
                (currentAmount !== "" && currentAmount !== undefined)
              }
            />
            {getErrorMessage("percentage") && (
              <p className="text-red-500 text-sm mt-1">
                {getErrorMessage("percentage")}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fixed Amount Off ($)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 10.00"
              {...register("amount", {
                valueAsNumber: true,
                validate: (value) => {
                  if (value === "" && currentPercentage === "")
                    return "Either percentage or amount must be provided.";
                  if (value !== "" && value! < 0)
                    return "Amount cannot be negative.";
                  if (value !== "" && currentPercentage !== "")
                    return "Cannot have both percentage and amount.";
                  return true;
                },
              })}
              className={cn(
                "w-full px-4 py-2 border rounded-md",
                getErrorMessage("amount") && "border-red-500"
              )}
              disabled={
                isPending ||
                (currentPercentage !== "" && currentPercentage !== undefined)
              }
            />
            {getErrorMessage("amount") && (
              <p className="text-red-500 text-sm mt-1">
                {getErrorMessage("amount")}
              </p>
            )}
          </div>
        </div>

        {/* Min Order Amount & Max Discount Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="minOrderAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Minimum Order Amount ($)
            </Label>
            <Input
              id="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 50.00"
              {...register("minOrderAmount", {
                valueAsNumber: true,
                min: { value: 0, message: "Min amount cannot be negative." },
              })}
              className={cn(
                "w-full px-4 py-2 border rounded-md",
                getErrorMessage("minOrderAmount") && "border-red-500"
              )}
              disabled={isPending}
            />
            {getErrorMessage("minOrderAmount") && (
              <p className="text-red-500 text-sm mt-1">
                {getErrorMessage("minOrderAmount")}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="maxDiscountAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Maximum Discount Amount ($)
            </Label>
            <Input
              id="maxDiscountAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 20.00"
              {...register("maxDiscountAmount", {
                valueAsNumber: true,
                min: { value: 0, message: "Max amount cannot be negative." },
              })}
              className={cn(
                "w-full px-4 py-2 border rounded-md",
                getErrorMessage("maxDiscountAmount") && "border-red-500"
              )}
              disabled={isPending}
            />
            {getErrorMessage("maxDiscountAmount") && (
              <p className="text-red-500 text-sm mt-1">
                {getErrorMessage("maxDiscountAmount")}
              </p>
            )}
          </div>
        </div>

        {/* Start and End Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="startsAt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Starts At <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !currentStartsAt && "text-muted-foreground",
                    getErrorMessage("startsAt") && "border-red-500"
                  )}
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {currentStartsAt ? (
                    format(currentStartsAt, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={currentStartsAt}
                  onSelect={(date) =>
                    setValue("startsAt", date || new Date(), {
                      shouldValidate: true,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {getErrorMessage("startsAt") && (
              <p className="text-red-500 text-sm mt-1">
                {getErrorMessage("startsAt")}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="expiresAt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Expires At <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !currentExpiresAt && "text-muted-foreground",
                    getErrorMessage("expiresAt") && "border-red-500"
                  )}
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {currentExpiresAt ? (
                    format(currentExpiresAt, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={currentExpiresAt}
                  onSelect={(date) =>
                    setValue("expiresAt", date || new Date(), {
                      shouldValidate: true,
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {getErrorMessage("expiresAt") && (
              <p className="text-red-500 text-sm mt-1">
                {getErrorMessage("expiresAt")}
              </p>
            )}
          </div>
        </div>

        {/* Is Active Checkbox */}
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="isActive"
            {...register("isActive")}
            disabled={isPending}
          />
          <Label
            htmlFor="isActive"
            className="text-sm font-medium text-gray-700"
          >
            Is Active
          </Label>
        </div>

        {/* Product Selection for Discount */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Apply to Specific Products (Optional)
          </Label>
          <ProductMultiSelect
            products={productsForSelection || []}
            selectedProductIds={currentProductIds}
            onSelect={(selectedIds) =>
              setValue("productIds", selectedIds, { shouldValidate: true })
            }
            disabled={isPending || productsLoading}
            error={getErrorMessage("productIds")}
          />
          {getErrorMessage("productIds") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("productIds")}
            </p>
          )}
          {productsLoading && (
            <p className="text-gray-500 text-sm mt-1">Loading products...</p>
          )}
          {productsError && (
            <p className="text-red-500 text-sm mt-1">
              Error loading products for selection.
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Updating...
              </>
            ) : (
              "Update Discount"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- ProductMultiSelect Component (for selecting products to apply discount) ---
interface ProductMultiSelectProps {
  products: ProductForSelection[];
  selectedProductIds: string[];
  onSelect: (selectedIds: string[]) => void;
  disabled?: boolean;
  error?: string;
}

function ProductMultiSelect({
  products,
  selectedProductIds,
  onSelect,
  disabled,
  error,
}: ProductMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onSelect(selectedProductIds.filter((id) => id !== productId));
    } else {
      onSelect([...selectedProductIds, productId]);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedProductNames = useMemo(() => {
    return products
      .filter((p) => selectedProductIds.includes(p.id))
      .map((p) => p.name);
  }, [products, selectedProductIds]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 min-h-[40px]",
            error && "border-red-500 focus:ring-red-500",
            disabled && "cursor-not-allowed opacity-50 bg-gray-100"
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedProductNames.length > 0
              ? selectedProductNames.join(", ")
              : "Select products..."}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999]">
        <Command>
          <CommandInput
            placeholder="Search products..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-10"
          />
          <CommandEmpty>No matching products found.</CommandEmpty>
          <ScrollArea className="h-60">
            <CommandGroup>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => toggleProduct(product.id)}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">{product.name}</span>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedProductIds.includes(product.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled className="text-gray-500">
                  Type to search or no products available.
                </CommandItem>
              )}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
