// components/seller/EditProductForm.tsx
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  UploadCloud,
  Trash2,
  PlusCircle,
  MinusCircle,
  Image as ImageIcon,
  ChevronDown,
  Check,
} from "lucide-react";
import { useToast } from "@/Hooks/use-toast";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { uploadToCloudinary } from "@/lib/cloudinary";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Product,
  ProductVariant,
  Category,
  SubCategory,
  SubSubCategory,
  ProductStatus,
} from "@prisma/client";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

// --- Type Definitions ---
interface CategoryData {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategoryData[];
}
interface SubCategoryData {
  id: string;
  name: string;
  slug: string;
  subSubCategories: SubSubCategoryData[];
}
interface SubSubCategoryData {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  images: string[];
  categoryId: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  stock: number;
  isFeatured?: boolean;
  status: ProductStatus; // Allow editing status
  variants: Array<{
    id?: string; // Optional: for existing variants
    size: string | null;
    color: string | null;
    price: number;
    stock: number;
    sku?: string;
  }>;
}

// Product data structure from API for editing
type ProductWithRelations = Product & {
  images: { url: string }[]; // Assuming images are stored as { url: string }[] directly on Product
  variants: ProductVariant[];
  category: Category;
  subCategory: SubCategory | null;
  subSubCategory: SubSubCategory | null;
};

interface EditProductFormProps {
  productId: string; // The ID of the product to edit
  //   onSuccess?: () => void; // Callback after successful product update
  //   onCancel?: () => void; // Callback to cancel/close the form
}

const initialNewVariant = {
  size: null,
  color: null,
  price: 0,
  stock: 0,
  sku: "",
};

// Function to fetch a single product for editing
const fetchProductForEdit = async (
  productId: string
): Promise<ProductWithRelations> => {
  const res = await fetch(`/api/store/products/${productId}`); // Your API endpoint
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch product for editing.");
  }
  const data = await res.json();
  return data.product; // Assuming API returns { product: ProductWithRelations }
};

// Function to fetch categories
const fetchCategories = async (): Promise<CategoryData[]> => {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch categories.");
  }
  return res.json();
};

export function EditProductForm({
  productId,
}: //   onSuccess,
//   onCancel,
EditProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch product data for editing
  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
    error: productError,
  } = useQuery<ProductWithRelations, Error>({
    queryKey: ["productForEdit", productId],
    queryFn: () => fetchProductForEdit(productId),
    enabled: !!productId, // Only fetch if productId is available
    staleTime: 0, // Always refetch fresh data for editing
    refetchOnWindowFocus: false,
  });

  // Fetch categories using react-query
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery<CategoryData[], Error>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset, // To reset form with fetched data
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      images: [],
      categoryId: "",
      subCategoryId: undefined,
      subSubCategoryId: undefined,
      stock: 0,
      isFeatured: false,
      status: ProductStatus.ACTIVE,
      variants: [initialNewVariant],
    },
    mode: "onBlur",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  // Populate form when productData is loaded
  useEffect(() => {
    if (productData) {
      reset({
        name: productData.name,
        description: productData.description || "",
        price: productData.price!,
        images: productData.images.map((img) => img), // Map to string array
        categoryId: productData.categoryId,
        subCategoryId: productData.subCategoryId || undefined,
        subSubCategoryId: productData.subSubCategoryId || undefined,
        stock: productData.stock!,
        status: productData.status,
        variants:
          productData?.variants?.length > 0
            ? productData?.variants.map((v) => ({
                id: v.id, // Keep ID for existing variants if needed for future granular updates
                size: v.size,
                color: v.color,
                price: v.price,
                stock: v.stock,
                sku: v.sku ?? undefined, // Convert null to undefined
              }))
            : [initialNewVariant], // If no variants, add one empty
      });
    }
  }, [productData, reset]);

  const currentImages = watch("images");
  const currentCategoryId = watch("categoryId");
  const currentSubCategoryId = watch("subCategoryId");
  const currentSubSubCategoryId = watch("subSubCategoryId");
  const router = useRouter();

  // Find selected category names for display
  const selectedTopCategory = categories?.find(
    (cat) => cat.id === currentCategoryId
  );
  const selectedSubCategory = selectedTopCategory?.subCategories?.find(
    (sub) => sub.id === currentSubCategoryId
  );
  const selectedSubSubCategory = selectedSubCategory?.subSubCategories?.find(
    (subSub) => subSub.id === currentSubSubCategoryId
  );

  const onDropImages = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast({
          title: "File rejected",
          description: "Please upload image files (PNG, JPEG, JPG).",
          variant: "destructive",
        });
        return;
      }
      setUploadingImage(true);
      try {
        const uploadedUrls = await Promise.all(
          acceptedFiles.map(uploadToCloudinary)
        );
        const newImages = [...(currentImages || []), ...uploadedUrls];
        setValue("images", newImages, { shouldValidate: true });
        toast({
          title: "Images Uploaded",
          description: `${uploadedUrls.length} image(s) uploaded.`,
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload images.",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    },
    [setValue, toast, currentImages]
  );

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } =
    useDropzone({
      onDrop: onDropImages,
      accept: { "image/jpeg": [], "image/png": [] },
      multiple: true,
      maxFiles: 5,
      maxSize: 5 * 1024 * 1024, // 5MB per file
      onDropRejected: (fileRejections: any[]) => {
        toast({
          title: "Image Files Rejected",
          description: fileRejections
            .map((r: { errors: any[] }) =>
              r.errors.map((e: { message: any }) => e.message).join(", ")
            )
            .join("; "),
          variant: "destructive",
        });
      },
    });

  const removeImage = useCallback(
    (indexToRemove: number) => {
      const updatedImages = currentImages.filter(
        (_, index) => index !== indexToRemove
      );
      setValue("images", updatedImages, { shouldValidate: true });
      toast({ title: "Image Removed", description: "Image has been removed." });
    },
    [setValue, toast, currentImages]
  );

  // Mutation for updating a product
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const res = await fetch(`/api/store/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update product.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product Updated",
        description: `${data.product.name} has been successfully updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] }); // Invalidate product list
      queryClient.invalidateQueries({
        queryKey: ["productForEdit", productId],
      }); // Invalidate current product data
      //   onSuccess?.(); // Call parent's success callback
      //   onCancel?.(); // Call parent's cancel callback
      reset(); // Reset form to initial state
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Product",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    updateProductMutation.mutate(data);
  };

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

  if (isProductLoading || categoriesLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  if (isProductError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading product:{" "}
        {productError?.message || "An unknown error occurred."}
        <p className="text-sm mt-2">
          Please try refreshing the page or check the product ID.
        </p>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="text-red-600 text-center py-8">
        Error loading categories: {categoriesError}. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6">Edit Product</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Name */}
        <div>
          <Label htmlFor="name" className="block text-sm font-medium  mb-1">
            Product Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Stylish T-shirt"
            {...register("name", { required: "Product name is required." })}
            className={cn(
              "w-full px-4 py-2 border rounded-md",
              getErrorMessage("name") && "border-red-500"
            )}
          />
          {getErrorMessage("name") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("name")}
            </p>
          )}
        </div>

        {/* Product Description */}
        <div>
          <Label
            htmlFor="description"
            className="block text-sm font-medium  mb-1"
          >
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Detailed description of the product..."
            rows={3}
            {...register("description")}
            className="w-full px-4 py-2 border rounded-md resize-y"
          />
        </div>

        {/* Product Price (Base) */}
        <div>
          <Label htmlFor="price" className="block text-sm font-medium  mb-1">
            Base Price <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            {...register("price", {
              required: "Base price is required.",
              valueAsNumber: true,
              min: { value: 0.01, message: "Price must be greater than 0." },
            })}
            className={cn(
              "w-full px-4 py-2 border rounded-md",
              getErrorMessage("price") && "border-red-500"
            )}
          />
          {getErrorMessage("price") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("price")}
            </p>
          )}
        </div>

        {/* Product Stock (Overall) */}
        <div>
          <Label htmlFor="stock" className="block text-sm font-medium  mb-1">
            Overall Stock <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock"
            type="number"
            min="0"
            placeholder="0"
            {...register("stock", {
              required: "Overall stock is required.",
              valueAsNumber: true,
              min: { value: 0, message: "Stock cannot be negative." },
            })}
            className={cn(
              "w-full px-4 py-2 border rounded-md",
              getErrorMessage("stock") && "border-red-500"
            )}
          />
          {getErrorMessage("stock") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("stock")}
            </p>
          )}
        </div>

        {/* Product Category Selection */}
        <div>
          <Label
            htmlFor="subSubCategoryId"
            className="block text-sm font-medium  mb-1"
          >
            Product Category <span className="text-red-500">*</span>
          </Label>
          <ProductCategorySearchableSelect
            id="subSubCategoryId"
            categories={categories || []}
            selectedValue={currentSubSubCategoryId}
            onSelect={(subSubCategoryId) => {
              let inferredCategoryId: string | undefined = undefined;
              let inferredSubCategoryId: string | undefined = undefined;

              categories?.forEach((cat) => {
                cat.subCategories?.forEach((sub) => {
                  sub.subSubCategories?.forEach((subSub) => {
                    if (subSub.id === subSubCategoryId) {
                      inferredCategoryId = cat.id;
                      inferredSubCategoryId = sub.id;
                    }
                  });
                });
              });

              setValue(`categoryId`, inferredCategoryId || "", {
                shouldValidate: true,
              });
              setValue(`subCategoryId`, inferredSubCategoryId, {
                shouldValidate: true,
              });
              setValue(`subSubCategoryId`, subSubCategoryId, {
                shouldValidate: true,
              });
            }}
            placeholder="Search by sub-sub-category..."
            error={
              getErrorMessage(`categoryId`) ||
              getErrorMessage(`subSubCategoryId`)
            }
          />
          {getErrorMessage("categoryId") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("categoryId")}
            </p>
          )}
          {(selectedTopCategory ||
            selectedSubCategory ||
            selectedSubSubCategory) && (
            <div className="mt-2 text-sm text-gray-600">
              Your product will appear under this categories:{" "}
              {selectedTopCategory?.name}{" "}
              {selectedSubCategory ? `> ${selectedSubCategory.name}` : ""}{" "}
              {selectedSubSubCategory ? `> ${selectedSubSubCategory.name}` : ""}
            </div>
          )}
        </div>

        {/* Product Images Upload */}
        <div>
          <Label className="block text-sm font-medium  mb-2">
            Upload Product Images (Up to 5){" "}
            <span className="text-red-500">*</span>
          </Label>
          <div
            {...getImageRootProps()}
            className={cn(
              "dropzone flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
              getErrorMessage("images")
                ? "border-red-500"
                : "border-blue-400 hover:border-blue-600"
            )}
          >
            <input {...getImageInputProps()} />
            {uploadingImage ? (
              <div className="flex flex-col items-center p-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                <p className=" text-lg font-medium">Uploading Image...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-lg font-semibold mb-1">
                  Drag 'n' drop product images here
                </p>
                <p className="text-sm mb-3">or click to select files</p>
                <Button
                  type="button"
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Choose Files
                </Button>
                <p className="text-xs mt-2">
                  Supported formats: PNG, JPEG, JPG (Max 5MB each, up to 5
                  files)
                </p>
              </div>
            )}
          </div>
          {getErrorMessage("images") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("images")}
            </p>
          )}

          {currentImages && currentImages.length > 0 && (
            <div className="mt-4">
              <Label className="block text-sm font-medium  mb-2">
                Images Preview
              </Label>
              <div className="flex flex-wrap gap-3 p-3 border border-gray-200 rounded-md">
                {currentImages.map((url, imgIdx) => (
                  <div
                    key={imgIdx}
                    className="relative w-32 h-32 rounded-md overflow-hidden shadow-sm border border-gray-200 group"
                  >
                    <img
                      src={url}
                      alt={`Product Image ${imgIdx + 1}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/128x128/e0e0e0/555555?text=Image+Error";
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(imgIdx)}
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click on an image to remove it.
              </p>
            </div>
          )}
        </div>

        {/* Product Variants Section */}
        <div className="mt-8 border p-6 rounded-lg border-blue-200">
          <h4 className="text-lg font-semibold  mb-4">
            Product Variants (Optional)
          </h4>
          {variantFields.map((variant, variantIndex) => (
            <div
              key={variant.id}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-blue-100 rounded-md shadow-sm relative"
            >
              <h5 className="text-md font-medium  col-span-full">
                Variant #{variantIndex + 1}
              </h5>
              {variantFields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeVariant(variantIndex)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  title="Remove variant"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              )}

              {/* Size */}
              <div>
                <Label
                  htmlFor={`variants.${variantIndex}.size`}
                  className="block text-sm font-medium  mb-1"
                >
                  Size (Optional)
                </Label>
                <Input
                  id={`variants.${variantIndex}.size`}
                  type="text"
                  placeholder="e.g., S, M, L"
                  {...register(`variants.${variantIndex}.size` as const)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              {/* Color */}
              <div>
                <Label
                  htmlFor={`variants.${variantIndex}.color`}
                  className="block text-sm font-medium  mb-1"
                >
                  Color (Optional)
                </Label>
                <Input
                  id={`variants.${variantIndex}.color`}
                  type="text"
                  placeholder="e.g., Red, Blue"
                  {...register(`variants.${variantIndex}.color` as const)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              {/* Variant Price */}
              <div>
                <Label
                  htmlFor={`variants.${variantIndex}.price`}
                  className="block text-sm font-medium  mb-1"
                >
                  Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`variants.${variantIndex}.price`}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register(`variants.${variantIndex}.price` as const, {
                    required: "Variant price is required.",
                    valueAsNumber: true,
                    min: {
                      value: 0.01,
                      message: "Price must be greater than 0.",
                    },
                  })}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md",
                    getErrorMessage(`variants.${variantIndex}.price`) &&
                      "border-red-500"
                  )}
                />
                {getErrorMessage(`variants.${variantIndex}.price`) && (
                  <p className="text-red-500 text-xs mt-1">
                    {getErrorMessage(`variants.${variantIndex}.price`)}
                  </p>
                )}
              </div>
              {/* Variant Stock */}
              <div>
                <Label
                  htmlFor={`variants.${variantIndex}.stock`}
                  className="block text-sm font-medium  mb-1"
                >
                  Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`variants.${variantIndex}.stock`}
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register(`variants.${variantIndex}.stock` as const, {
                    required: "Variant stock is required.",
                    valueAsNumber: true,
                    min: { value: 0, message: "Stock cannot be negative." },
                  })}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md",
                    getErrorMessage(`variants.${variantIndex}.stock`) &&
                      "border-red-500"
                  )}
                />
                {getErrorMessage(`variants.${variantIndex}.stock`) && (
                  <p className="text-red-500 text-xs mt-1">
                    {getErrorMessage(`variants.${variantIndex}.stock`)}
                  </p>
                )}
              </div>
              {/* SKU (Optional) */}
              <div className="col-span-full">
                <Label
                  htmlFor={`variants.${variantIndex}.sku`}
                  className="block text-sm font-medium  mb-1"
                >
                  SKU (Optional)
                </Label>
                <Input
                  id={`variants.${variantIndex}.sku`}
                  type="text"
                  placeholder="Unique identifier"
                  {...register(`variants.${variantIndex}.sku` as const)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendVariant(initialNewVariant)}
            className="mt-4 flex items-center text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
          </Button>
        </div>

        {/* Is Featured Checkbox */}
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox id="isFeatured" {...register("isFeatured")} />
          <Label htmlFor="isFeatured" className="text-sm font-medium">
            Mark as Featured Product
          </Label>
        </div>

        {/* Product Status */}
        <div>
          <Label htmlFor="status" className="block text-sm font-medium mb-1">
            Product Status <span className="text-red-500">*</span>
          </Label>
          <select
            id="status"
            {...register("status", { required: "Product status is required." })}
            className={cn(
              "w-full px-4 py-2 border rounded-md",
              getErrorMessage("status") && "border-red-500"
            )}
          >
            {Object.values(ProductStatus).map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase())}
              </option>
            ))}
          </select>
          {getErrorMessage("status") && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage("status")}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()} // Navigate back to previous page
            disabled={isSubmitting || updateProductMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || updateProductMutation.isPending}
          >
            {isSubmitting || updateProductMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Updating...
              </>
            ) : (
              "Update Product"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- ProductCategorySearchableSelect Component (Re-used from previous turns) ---
interface ProductCategorySearchableSelectProps {
  id: string;
  categories: CategoryData[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

function ProductCategorySearchableSelect({
  id,
  categories,
  selectedValue,
  onSelect,
  placeholder = "Select a category...",
  disabled = false,
  error,
}: ProductCategorySearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const allSubSubCategories: { id: string; name: string; path: string }[] =
    useMemo(() => {
      const list: { id: string; name: string; path: string }[] = [];
      categories.forEach((cat) => {
        cat.subCategories.forEach((sub) => {
          sub.subSubCategories.forEach((subSub) => {
            list.push({
              id: subSub.id,
              name: subSub.name,
              path: `${cat.name} > ${sub.name} > ${subSub.name}`,
            });
          });
        });
      });
      return list;
    }, [categories]);

  const selectedItemName = selectedValue
    ? allSubSubCategories.find((option) => option.id === selectedValue)?.name ||
      ""
    : "";

  const filteredOptions = allSubSubCategories.filter((option) =>
    option.path.toLowerCase().includes(searchValue.toLowerCase())
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
          <ScrollArea className="h-60">
            <CommandGroup>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.path}
                    onSelect={() => {
                      onSelect(option.id);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1 space-y-1">
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {option.name}
                      </h3>
                      <span className="truncate">{option.path}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedValue === option.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled className="text-gray-500">
                  Type to search or no options available.
                </CommandItem>
              )}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
