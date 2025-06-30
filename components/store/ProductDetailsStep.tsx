// components/store/ProductDetailsStep.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronDown,
  PlusCircle,
  Trash2,
  Tags,
  Package,
  Loader2,
  Info, // Icon for About section
  DollarSign,
  UploadCloud, // Icon for Price & Inventory
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  useFieldArray,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  Control,
} from "react-hook-form";

// Import the ProductVariantsSection component
import { useDropzone } from "react-dropzone";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/Hooks/use-toast";
import { ProductVariantsSection } from "./ProductVariantSection";

// --- Type Definitions (Ensure these match your Prisma schema and MultiStepStoreCreationForm) ---
interface Category {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  subSubCategories: SubSubCategory[];
}

interface SubSubCategory {
  id: string;
  name: string;
  slug: string;
}

// Define the overall shape of the form data for StoreFormData from parent
interface StoreFormData {
  name: string;
  description?: string;
  logo: string;
  banners: string[];
  products: Array<{
    name: string;
    description?: string;
    price: number;
    images: string[];
    categoryId: string;
    subCategoryId?: string;
    subSubCategoryId?: string;
    stock: number;
    isFeatured?: boolean;
    variants: Array<{
      size: string | null;
      color: string | null;
      price: number;
      stock: number;
      sku?: string;
    }>;
  }>;
}

// Props received from MultiStepStoreCreationForm
interface ProductDetailsStepProps {
  control: Control<StoreFormData>;
  register: UseFormRegister<StoreFormData>;
  setValue: UseFormSetValue<StoreFormData>;
  watch: UseFormWatch<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

// Function to fetch categories (assuming nested structure from API)
const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch("/api/categories"); // Assuming /api/categories returns nested data
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch categories.");
  }
  return res.json();
};

export function ProductDetailsStep({
  control,
  register,
  setValue,
  watch,
  errors,
}: ProductDetailsStepProps) {
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Top-level useFieldArray for products
  const {
    fields: products,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: "products",
  });

  const addProduct = useCallback(() => {
    appendProduct({
      name: "",
      description: "",
      price: 0,
      images: [],
      categoryId: "",
      stock: 0,
      isFeatured: false,
      variants: [{ size: null, color: null, price: 0, stock: 0, sku: "" }],
    });
  }, [appendProduct]);

  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-700">
        <Loader2 className="animate-spin mr-2 h-8 w-8 text-blue-600" /> Loading
        product categories...
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading categories: {categoriesError}. Please refresh the page.
      </div>
    );
  }

  // Helper function to render validation errors from react-hook-form
  const renderError = (fieldPath: string) => {
    const error = errors;
    const errorObject = fieldPath.split(".").reduce((acc, part) => {
      return (
        acc &&
        (acc[parseInt(part)] !== undefined ? acc[parseInt(part)] : acc[part])
      );
    }, error as any);

    return errorObject?.message ? (
      <p className="text-red-500 text-sm mt-1">{errorObject.message}</p>
    ) : null;
  };

  return (
    <div className="space-y-10">
      {products.map((product, pIdx) => {
        // Watch selected category IDs to filter subcategories
        const currentCategoryId = watch(`products.${pIdx}.categoryId`);
        const currentSubCategoryId = watch(`products.${pIdx}.subCategoryId`);

        const selectedCategory = categories?.find(
          (cat) => cat.id === currentCategoryId
        );
        const selectedSubCategory = selectedCategory?.subCategories?.find(
          (sub) => sub.id === currentSubCategoryId
        );

        return (
          <div
            key={product.id} // Use product.id from useFieldArray for stable key
            className="border border-gray-200 rounded-xl p-8 shadow-lg bg-gray-50 relative"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between border-b pb-4">
              <Package className="h-7 w-7 mr-3 text-gray-700" /> Product #
              {pIdx + 1}
              {products.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProduct(pIdx)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  title="Remove product"
                >
                  <Trash2 className="h-6 w-6" />
                </Button>
              )}
            </h3>

            {/* SECTION: About */}
            <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
              <h4 className="text-xl font-bold text-gray-800 mb-5 flex items-center pb-3 border-b border-gray-100">
                <Info className="h-6 w-6 mr-3 text-gray-700" /> About
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <Label
                    htmlFor={`products.${pIdx}.name`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`products.${pIdx}.name`}
                    type="text"
                    placeholder="e.g., Classic White T-Shirt"
                    {...register(`products.${pIdx}.name`, {
                      required: "Product name is required.",
                    })}
                    className={cn(
                      "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150",
                      errors?.products?.[pIdx]?.name &&
                        "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {renderError(`products.${pIdx}.name`)}
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <Label
                    htmlFor={`products.${pIdx}.description`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description (Optional)
                  </Label>
                  <Textarea
                    id={`products.${pIdx}.description`}
                    placeholder="Describe your product in detail..."
                    rows={4}
                    {...register(`products.${pIdx}.description`)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y transition duration-150"
                  />
                </div>

                {/* Image URLs */}
                {/* <div className="col-span-2">
                  <Label
                    htmlFor={`products.${pIdx}.images`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Image URLs (comma-separated){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`products.${pIdx}.images`}
                    type="text"
                    placeholder="https://img1.com/product.jpg, https://img2.com/product_b.jpg"
                    {...register(`products.${pIdx}.images`, {
                      required: "At least one image URL is required.",
                      setValueAs: (value: string) =>
                        value
                          .split(",")
                          .map((url) => url.trim())
                          .filter(Boolean),
                      validate: (value: string[]) =>
                        value.length > 0 || "At least one image URL is required.",
                    })}
                    className={cn(
                      "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150",
                      errors?.products?.[pIdx]?.images &&
                        "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {renderError(`products.${pIdx}.images`)}
                  {watch(`products.${pIdx}.images`)?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {watch(`products.${pIdx}.images`).map(
                        (img: string, imgIdx: number) => (
                          <img
                            key={imgIdx}
                            src={img}
                            alt={`Product ${pIdx} Image ${imgIdx}`}
                            className="w-20 h-20 object-cover rounded-md border border-gray-200 shadow-sm"
                          />
                        )
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Provide direct image URLs. For best results, use square
                    images.
                  </p>
                </div> */}

                <ProductImageUploadSection
                  pIdx={pIdx}
                  control={control}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  errors={errors}
                  renderError={renderError}
                />
                {/* </div> */}

                {/* Category Searchable Select */}
                <div>
                  <Label
                    htmlFor={`products.${pIdx}.categoryId`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <CategorySearchableSelect
                    id={`products.${pIdx}.categoryId`}
                    options={categories || []}
                    selectedValue={currentCategoryId}
                    onSelect={(value) => {
                      setValue(`products.${pIdx}.categoryId`, value, {
                        shouldValidate: true,
                      });
                      // Reset sub-categories when main category changes
                      setValue(`products.${pIdx}.subCategoryId`, undefined, {
                        shouldValidate: true,
                      });
                      setValue(`products.${pIdx}.subSubCategoryId`, undefined, {
                        shouldValidate: true,
                      });
                    }}
                    placeholder="Search categories..."
                    error={errors?.products?.[pIdx]?.categoryId?.message}
                  />
                  {renderError(`products.${pIdx}.categoryId`)}
                </div>

                {/* SubCategory Searchable Select */}
                <div>
                  <Label
                    htmlFor={`products.${pIdx}.subCategoryId`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subcategory (Optional)
                  </Label>
                  <CategorySearchableSelect
                    id={`products.${pIdx}.subCategoryId`}
                    options={selectedCategory?.subCategories || []}
                    selectedValue={currentSubCategoryId}
                    onSelect={(value) => {
                      setValue(`products.${pIdx}.subCategoryId`, value, {
                        shouldValidate: true,
                      });
                      setValue(`products.${pIdx}.subSubCategoryId`, undefined, {
                        shouldValidate: true,
                      });
                    }}
                    placeholder="Search subcategories..."
                    disabled={
                      !currentCategoryId ||
                      selectedCategory?.subCategories?.length === 0
                    }
                    error={errors?.products?.[pIdx]?.subCategoryId?.message}
                  />
                  {renderError(`products.${pIdx}.subCategoryId`)}
                </div>

                {/* SubSubCategory Searchable Select */}
                <div>
                  <Label
                    htmlFor={`products.${pIdx}.subSubCategoryId`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sub-Subcategory (Optional)
                  </Label>
                  <CategorySearchableSelect
                    id={`products.${pIdx}.subSubCategoryId`}
                    options={selectedSubCategory?.subSubCategories || []}
                    selectedValue={watch(`products.${pIdx}.subSubCategoryId`)}
                    onSelect={(value) =>
                      setValue(`products.${pIdx}.subSubCategoryId`, value, {
                        shouldValidate: true,
                      })
                    }
                    placeholder="Search sub-subcategories..."
                    disabled={
                      !currentSubCategoryId ||
                      selectedSubCategory?.subSubCategories?.length === 0
                    }
                    error={errors?.products?.[pIdx]?.subSubCategoryId?.message}
                  />
                  {renderError(`products.${pIdx}.subSubCategoryId`)}
                </div>
              </div>
            </div>

            {/* SECTION: Price & Inventory */}
            <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
              <h4 className="text-xl font-bold text-gray-800 mb-5 flex items-center pb-3 border-b border-gray-100">
                <DollarSign className="h-6 w-6 mr-3 text-gray-700" /> Price &
                Inventory
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Price */}
                <div>
                  <Label
                    htmlFor={`products.${pIdx}.price`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Base Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`products.${pIdx}.price`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="29.99"
                    {...register(`products.${pIdx}.price`, {
                      required: "Price is required.",
                      valueAsNumber: true,
                      min: {
                        value: 0.01,
                        message: "Price must be greater than 0.",
                      },
                    })}
                    className={cn(
                      "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150",
                      errors?.products?.[pIdx]?.price &&
                        "border-red-500 focus:ring-red-500"
                    )}
                  />
                  {renderError(`products.${pIdx}.price`)}
                </div>

                {/* Overall Product Stock */}
                <div>
                  <Label
                    htmlFor={`products.${pIdx}.stock`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Overall Product Stock{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`products.${pIdx}.stock`}
                    type="number"
                    min="0"
                    placeholder="100"
                    {...register(`products.${pIdx}.stock`, {
                      required: "Stock is required.",
                      valueAsNumber: true,
                      min: { value: 0, message: "Stock cannot be negative." },
                    })}
                    className={cn(
                      "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150",
                      errors?.products?.[pIdx]?.stock &&
                        "border-red-500 focus:ring-red-500"
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is total stock for the base product.
                  </p>
                  {renderError(`products.${pIdx}.stock`)}
                </div>
              </div>
            </div>

            {/* SECTION: Variations */}
            <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
              <h4 className="text-xl font-bold text-gray-800 mb-5 flex items-center pb-3 border-b border-gray-100">
                <Tags className="h-6 w-6 mr-3 text-gray-700" /> Variations
              </h4>
              {/* Render the extracted ProductVariantsSection */}
              <ProductVariantsSection
                pIdx={pIdx}
                control={control}
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
                renderError={renderError}
              />
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addProduct}
        className="w-full flex items-center gap-2 py-3 text-lg font-bold border-2 border-dashed border-gray-400 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors"
      >
        <PlusCircle className="h-5 w-5" /> Add Another Product
      </Button>

      {errors.products && (
        <p className="text-red-500 text-sm mt-2 text-center">
          {errors.products.message}
        </p>
      )}
    </div>
  );
}

// --- CategorySearchableSelect Component (unchanged) ---
interface CategorySearchableSelectProps {
  id: string;
  options: (Category | SubCategory | SubSubCategory)[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

function CategorySearchableSelect({
  id,
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option...",
  disabled = false,
  error,
}: CategorySearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedItemName =
    options.find((option) => option.id === selectedValue)?.name || "";

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150",
            error && "border-red-500 focus:ring-red-500",
            disabled && "cursor-not-allowed opacity-50 bg-gray-100"
          )}
          disabled={disabled}
        >
          {selectedItemName || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999]">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-10"
          />
          <CommandEmpty>No matching items found.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onSelect(option.id);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled className="text-gray-500">
                Type to search or no options available.
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ProductImageUploadSectionProps {
  pIdx: number; // Index of the current product
  control: Control<StoreFormData>;
  register: UseFormRegister<StoreFormData>;
  setValue: UseFormSetValue<StoreFormData>;
  watch: UseFormWatch<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
  renderError: (fieldPath: string) => React.ReactNode; // Helper to render errors
}

export function ProductImageUploadSection({
  pIdx,
  control,
  register,
  setValue,
  watch,
  errors,
  renderError,
}: ProductImageUploadSectionProps) {
  const { toast } = useToast();
  const [uploadingImages, setUploadingImages] = useState(false);

  // Watch the current product's images array from the centralized form state
  const currentImages = watch(`products.${pIdx}.images`) || [];

  const onDropImages = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast({
          title: "File Rejected",
          description: "Please upload image files (PNG, JPEG, JPG).",
          variant: "destructive",
        });
        return;
      }
      setUploadingImages(true);
      try {
        const uploadedUrls = await Promise.all(
          acceptedFiles.map(uploadToCloudinary)
        );
        // Append new URLs to the existing images array in the form state
        setValue(
          `products.${pIdx}.images`,
          [...currentImages, ...uploadedUrls],
          {
            shouldValidate: true, // Re-validate the field after setting value
          }
        );
        toast({
          title: "Images Uploaded",
          description: `${uploadedUrls.length} file(s) uploaded.`,
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Upload failed.",
          variant: "destructive",
        });
      } finally {
        setUploadingImages(false);
      }
    },
    [currentImages, pIdx, setValue, toast] // Dependencies for useCallback
  );

  const removeImage = useCallback(
    (indexToRemove: number) => {
      const updatedImages = currentImages.filter(
        (_, index) => index !== indexToRemove
      );
      setValue(`products.${pIdx}.images`, updatedImages, {
        shouldValidate: true,
      });
      toast({
        title: "Image Removed",
        description: "Product image has been removed.",
      });
    },
    [currentImages, pIdx, setValue, toast]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onDropImages,
    accept: { "image/jpeg": [], "image/png": [] },
    multiple: true,
    maxSize: 5 * 1024 * 1024, // 5MB per file
    onDropRejected: (fileRejections) => {
      toast({
        title: "File Rejected",
        description: fileRejections
          .map((r) => r.errors.map((e) => e.message).join(", "))
          .join("; "),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="col-span-2">
      {" "}
      {/* This takes full width in the grid */}
      <Label
        htmlFor={`products.${pIdx}.images`}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Product Images <span className="text-red-500">*</span>
      </Label>
      <div
        {...getRootProps()}
        className={cn(
          "dropzone mt-2 border-2 border-dashed p-5 rounded-lg cursor-pointer text-center bg-gray-50 hover:bg-gray-100 transition",
          errors?.products?.[pIdx]?.images && "border-red-500" // Apply error styling
        )}
      >
        <input {...getInputProps()} />
        {uploadingImages ? (
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
            <span className="ml-2 text-sm text-blue-600">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-sm text-gray-700">
              Click or drag images here to upload
            </p>
          </div>
        )}
      </div>
      {renderError(`products.${pIdx}.images`)} {/* Display error message */}
      {currentImages.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {currentImages.map((url, index) => (
            <div
              key={index} // Use array index as key if URLs are not guaranteed unique
              className="relative w-24 h-24 rounded-md overflow-hidden border group" // Added group for hover effect
            >
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/96x96/e0e0e0/555555?text=Img+Error"; // Fallback image
                }}
              />
              <Button
                type="button"
                onClick={() => removeImage(index)}
                variant="destructive" // Style as destructive button
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Supported formats: PNG, JPEG, JPG (Max 5MB each). Provide high-quality
        images for best results.
      </p>
    </div>
  );
}
