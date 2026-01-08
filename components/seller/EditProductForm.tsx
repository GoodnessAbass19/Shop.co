// components/seller/EditProductForm.tsx
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useForm, useFieldArray, FieldErrors, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  UploadCloud,
  Trash2,
  PlusCircle,
  MinusCircle,
  Image as ImageIcon,
  ChevronDown,
  Check,
  Clock,
  CalendarIcon,
  ArrowLeft,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, COLOR_FAMILIES, variantValue } from "@/lib/utils";
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
  VariantType,
} from "@prisma/client";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { CreateProductSchema } from "@/lib/form-schema";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "../ui/separator";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import SimpleEditor from "../tiptap-templates/simple/simple-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import parse from "html-react-parser";

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
  productVariantType: VariantType;
}

type Inputs = z.infer<typeof CreateProductSchema>;

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
  price: 0,
  stock: 0,
  sellerSku: "",
  salePrice: 0,
  saleStartDate: new Date(),
  saleEndDate: new Date(),
  gtinBarcode: "",
};

interface PriceChangeParams {
  index: number;
  field: "price" | "salePrice" | "stock";
  value: string;
}

type VariantFieldKey =
  | "variant"
  | "size"
  | "shoe_size"
  | "drink_size"
  | "volume";

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

export function EditProductForm({ productId }: EditProductFormProps) {
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
  } = useForm<Inputs>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: "",
      description: "",
      highlight: "",
      images: [],
      categoryId: "",
      subCategoryId: undefined,
      subSubCategoryId: undefined,
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
        description: productData.description!,
        images: productData.images.map((img) => img), // Map to string array
        brand: productData.brand!,
        color: productData.color || undefined,
        colorFamily: productData.colorFamily,
        highlight: productData.highlight!,
        weight: productData.weight!,
        categoryId: productData.categoryId,
        subCategoryId: productData.subCategoryId || undefined,
        subSubCategoryId: productData.subSubCategoryId || undefined,
        variants:
          productData.variants.length > 0
            ? productData.variants.map((v) => ({
                id: v.id, // Keep ID for existing variants if needed for future granular updates
                size: v.size || undefined,
                variant: v.variation || undefined,
                shoe_size: v.size || undefined,
                drink_size: v.drinkSize || undefined,
                volume: v.volume || undefined,
                sellerSku: v.sellerSku,
                gtinBarcode: v.gtinBarcode || undefined,
                saleStartDate: v.saleStartDate || undefined,
                price: v.price,
                salePrice: v.salePrice || undefined,
                saleEndDate: v.saleEndDate || undefined,
                stock: v.quantity,
                sku: v.sellerSku ?? undefined, // Convert null to undefined
              }))
            : [initialNewVariant], // If no variants, add one empty
      });
    }
  }, [productData, reset]);

  const currentImages = watch("images");
  const currentCategoryId = watch("categoryId");
  const currentSubCategoryId = watch("subCategoryId");
  const currentSubSubCategoryId = watch("subSubCategoryId");
  const currentSelectedColors = watch("colorFamily");
  const [selectedColors, setSelectedColors] = useState<string[]>(
    currentSelectedColors! || []
  );
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (currentSelectedColors) {
      setSelectedColors(currentSelectedColors);
    }
  }, [currentSelectedColors]);

  // Toggle selection of a color
  const toggleColor = (color: string) => {
    let updatedColors: string[];
    if (selectedColors.includes(color)) {
      updatedColors = selectedColors.filter((c) => c !== color);
    } else {
      // Optional: Add a limit if your schema has .max(n)
      if (selectedColors.length >= 5) {
        toast({
          title: "Limit reached",
          description: "You can select up to 5 colors.",
        });
        return;
      }
      updatedColors = [...selectedColors, color];
    }

    // 1. Update local UI state
    setSelectedColors(updatedColors);

    // 2. IMPORTANT: Update React Hook Form state
    // use { shouldValidate: true } to clear errors as the user fixes them
    setValue("colorFamily", updatedColors, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const removeColor = (e: React.MouseEvent, color: string) => {
    e.stopPropagation(); // Prevent the dropdown from opening/closing
    const updatedColors = selectedColors.filter((c) => c !== color);

    setSelectedColors(updatedColors);
    setValue("colorFamily", updatedColors, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Find selected category names for display
  const watchedVariants = useWatch({ control, name: "variants" });
  const selectedCategory = categories?.find(
    (cat) => cat.id === currentCategoryId
  );
  const selectedSubCategory = selectedCategory?.subCategories?.find(
    (sub) => sub.id === currentSubCategoryId
  );
  const selectedSubSubCategory = selectedSubCategory?.subSubCategories?.find(
    (subSub) => subSub.id === currentSubSubCategoryId
  );

  const handlePriceChange = ({ index, field, value }: PriceChangeParams) => {
    // 1. Convert to string and strip all non-numeric/non-decimal characters immediately
    let cleanValue = value.toString().replace(/[^0-9.]/g, "");

    // 2. Prevent multiple decimals (e.g., 12.34.56 -> 12.3456)
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    // 3. Update the form state
    setValue(`variants.${index}.${field}` as any, cleanValue, {
      shouldValidate: true,
    });
  };

  const renderValueField = (index: number, type: VariantType) => {
    const currentValue = watchedVariants?.[index]?.variant;

    if (type === VariantType.VARIATION) {
      return (
        <div className="space-y-1">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Variant
          </Label>
          <Input
            {...register(`variants.${index}.variant`)}
            placeholder="..."
            className="bg-white"
          />
        </div>
      );
    }

    let options: string[] = [];
    let label = "Variant";
    let field: VariantFieldKey = "variant";

    switch (type) {
      case VariantType.SIZE:
        options = variantValue.shirts;
        label = "Size";
        field = "size";
        break;
      case VariantType.SIZE_SHOE:
        options = variantValue.shoes;
        label = "Size";
        field = "shoe_size";
        break;
      case VariantType.DRINK_SIZE:
        options = variantValue.drink;
        label = "Drink Pack Size";
        field = "drink_size";
        break;
      case VariantType.VOLUME:
        options = variantValue.volume;
        label = "Volume";
        field = "volume";
        break;
    }

    return (
      <div className="space-y-1">
        <Label className="text-xs font-bold capitalize tracking-wider text-slate-500">
          {label}{" "}
          {(type === VariantType.SIZE || type === VariantType.SIZE_SHOE) && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        <Select
          onValueChange={(val) => setValue(`variants.${index}.${field}`, val)}
          value={currentValue}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder={`${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt} className="capitalize">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

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
    mutationFn: async (data: Inputs) => {
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

  const onSubmit = (data: Inputs) => {
    updateProductMutation.mutate(data);
  };

  const onError = (errors: any) => {
    console.error("Validation Errors:", errors);
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
    <div className="space-y-6 p-2 w-full">
      <div className="flex flex-row gap-2 items-center justify-start">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 font-bold" />
        </button>
        <h2 className="text-xl font-bold">Edit Product</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
        <div className="space-y-5">
          <h3 className="text-lg font-semibold capitalize">
            product information
          </h3>
          {/* Product Information */}
          <div className="space-y-5">
            {/* Product Images Upload */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Upload Product Images (Up to 5){" "}
                <span className="text-red-500">*</span>
              </Label>
              <div
                {...getImageRootProps()}
                className={cn(
                  "dropzone flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200",
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
                    <p className="text-lg font-medium font-sans mb-1">
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
                      Image needs to be between 500x500 and 2000x2000 pixels.
                      White backgrounds are recommended. No watermarks.
                      Supported formats: PNG, JPEG, JPG (Max 2MB each, up to 5
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
                  <div className="flex flex-wrap gap-3 p-3 border border-gray-200 rounded-md bg-gray-50">
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

            {/* Name and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="col-span-1">
                <Label
                  htmlFor="name"
                  className="block text-sm font-medium  mb-1"
                >
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Men's t-shirt"
                  {...register("name", {
                    required: "Product name is required.",
                    maxLength: 70,
                  })}
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
                    setValue(`subCategoryId`, inferredSubCategoryId!, {
                      shouldValidate: true,
                    });
                    setValue(`subSubCategoryId`, subSubCategoryId, {
                      shouldValidate: true,
                    });
                  }}
                  placeholder="Search for category..."
                  error={
                    getErrorMessage(`categoryId`) ||
                    getErrorMessage(`subSubCategoryId`)
                  }
                />
                {getErrorMessage("subSubCategoryId") && (
                  <p className="text-red-500 text-sm mt-1">
                    {getErrorMessage("categoryId")}
                  </p>
                )}
                {(selectedCategory ||
                  selectedSubCategory ||
                  selectedSubSubCategory) && (
                  <div className="mt-2 text-sm text-gray-600">
                    Your product will appear under this categories:{" "}
                    {selectedCategory?.name}{" "}
                    {selectedSubCategory ? `> ${selectedSubCategory.name}` : ""}{" "}
                    {selectedSubSubCategory
                      ? `> ${selectedSubSubCategory.name}`
                      : ""}
                  </div>
                )}
              </div>
            </div>

            {currentSubSubCategoryId && (
              <>
                {/* Brand, Color, Color Family and Weight */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <Label
                      htmlFor="brand"
                      className="block text-sm font-medium  mb-1"
                    >
                      Brand <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="brand"
                      type="text"
                      placeholder="Brand"
                      {...register("brand")}
                      className={cn(
                        "w-full px-4 py-2 border rounded-md",
                        getErrorMessage("brand") && "border-red-500"
                      )}
                    />
                    {getErrorMessage("brand") && (
                      <p className="text-red-500 text-sm mt-1">
                        {getErrorMessage("brand")}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <Label
                      htmlFor="color"
                      className="block text-sm font-medium  mb-1"
                    >
                      Color
                    </Label>
                    <Input
                      id="color"
                      type="text"
                      placeholder="Main color of the product"
                      {...register("color")}
                      className={cn(
                        "w-full px-4 py-2 border rounded-md",
                        getErrorMessage("color") && "border-red-500"
                      )}
                    />
                    {getErrorMessage("color") && (
                      <p className="text-red-500 text-sm mt-1">
                        {getErrorMessage("color")}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <Label
                      htmlFor="colorFamily"
                      className="block text-sm font-medium  mb-1"
                    >
                      Color Family
                    </Label>
                    <div className="relative">
                      {/* Trigger / Display area */}
                      <div
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full p-1 flex flex-wrap gap-2 border rounded-lg cursor-pointer transition-all bg-white hover:border-blue-400 ${
                          isOpen
                            ? "ring-2 ring-blue-100 border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedColors.length === 0 ? (
                          <span className="text-gray-400 py-1 px-2">
                            Choose colors...
                          </span>
                        ) : (
                          selectedColors.map((color) => (
                            <span
                              key={color}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-black text-sm font-medium rounded-full border border-blue-100 animate-in fade-in zoom-in duration-200"
                            >
                              {color}
                              <X
                                size={10}
                                className="hover:text-blue-900 cursor-pointer"
                                onClick={(e) => removeColor(e, color)}
                              />
                            </span>
                          ))
                        )}

                        <div className="ml-auto pr-2 flex items-center">
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      {isOpen && (
                        <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                          <div className="max-h-60 overflow-y-auto p-1">
                            {COLOR_FAMILIES.map((color) => {
                              const isSelected = selectedColors.includes(color);
                              return (
                                <div
                                  key={color}
                                  onClick={() => toggleColor(color)}
                                  className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer rounded-md transition-colors ${
                                    isSelected
                                      ? "bg-blue-50 text-blue-700 font-medium"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Visual Color Swatch */}
                                    <span
                                      className="w-4 h-4 rounded-full border border-gray-200"
                                      style={{
                                        backgroundColor:
                                          color === "Multicolor"
                                            ? "transparent"
                                            : color.toLowerCase(),
                                        backgroundImage:
                                          color === "Multicolor"
                                            ? "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)"
                                            : "none",
                                      }}
                                    />
                                    {color}
                                  </div>
                                  {isSelected && (
                                    <Check
                                      size={16}
                                      className="text-blue-600"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer */}
                          <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <button
                              type="button"
                              onClick={() => setSelectedColors([])}
                              className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1"
                            >
                              Clear all
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsOpen(false)}
                              className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {getErrorMessage("colorFamily") && (
                      <p className="text-red-500 text-sm mt-1">
                        {getErrorMessage("colorFamily")}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <Label
                      htmlFor="weight"
                      className="block text-sm font-medium  mb-1"
                    >
                      Weight <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="weight"
                      type="text"
                      placeholder="Ex. 12kg, 800g [Weight of the product for storage and shipping]"
                      {...register("weight")}
                      className={cn(
                        "w-full px-4 py-2 border rounded-md placeholder:text-[10px]",
                        getErrorMessage("weight") && "border-red-500"
                      )}
                    />
                    {getErrorMessage("weight") && (
                      <p className="text-red-500 text-sm mt-1">
                        {getErrorMessage("weight")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Product description text field */}
                <div>
                  <Label
                    htmlFor="description"
                    className="block text-sm font-medium  mb-1"
                  >
                    Product Description <span className="text-red-500">*</span>
                  </Label>

                  <SimpleEditor
                    contents={watch("description")}
                    setContents={(content: string) =>
                      setValue("description", content)
                    }
                  />
                  {getErrorMessage("description") && (
                    <p className="text-red-500 text-sm mt-1">
                      {getErrorMessage("description")}
                    </p>
                  )}
                </div>

                {/* PRODUCT HIGHLIGHT FIELD */}
                <div>
                  <Label
                    htmlFor="highlight"
                    className="block text-sm font-medium  mb-1"
                  >
                    Highlights <span className="text-red-500">*</span>
                  </Label>

                  <SimpleEditor
                    contents={watch("highlight")}
                    setContents={(content: string) =>
                      setValue("highlight", content)
                    }
                  />
                  {getErrorMessage("highlight") && (
                    <p className="text-red-500 text-sm mt-1">
                      {getErrorMessage("highlight")}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product Variants */}
        {currentSubSubCategoryId && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold capitalize">
              product variants
            </h3>

            {variantFields.map((variant, variantIndex) => {
              const hasPrice =
                (watchedVariants?.[variantIndex]?.price || 0) > 0;
              const hasSalePrice =
                (watchedVariants?.[variantIndex]?.salePrice || 0) > 0;
              const hour = new Date().getHours();
              const minute = new Date().getMinutes();
              const seconds = new Date().getSeconds();

              return (
                <div key={variant.id} className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* custom field for variants */}
                    {renderValueField(
                      variantIndex,
                      selectedSubSubCategory?.productVariantType!
                    )}

                    {/* Seller Sku */}
                    <div className="col-span-1">
                      <Label
                        htmlFor={`variants.${variantIndex}.sellerSku`}
                        className="block text-sm font-medium  mb-1"
                      >
                        Seller Sku <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`variants.${variantIndex}.sellerSku`}
                        type="text"
                        placeholder="Sku for identifying variants"
                        {...register(`variants.${variantIndex}.sellerSku`)}
                        className={cn(
                          "w-full px-4 py-2 border rounded-md",
                          getErrorMessage(
                            `variants.${variantIndex}.sellerSku`
                          ) && "border-red-500"
                        )}
                      />
                      {getErrorMessage(
                        `variants.${variantIndex}.sellerSku`
                      ) && (
                        <p className="text-red-500 text-sm mt-1">
                          {getErrorMessage(
                            `variants.${variantIndex}.sellerSku`
                          )}
                        </p>
                      )}
                    </div>

                    {/* GTIN CODE */}
                    <div className="col-span-1">
                      <Label
                        htmlFor={`variants.${variantIndex}.gtinBarcode`}
                        className="block text-sm font-medium  mb-1"
                      >
                        GTIN Barcode
                      </Label>
                      <Input
                        id={`variants.${variantIndex}.gtinBarcode`}
                        type="text"
                        placeholder="GTIN Barcode"
                        {...register(`variants.${variantIndex}.gtinBarcode`)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <Label
                        htmlFor={`variants.${variantIndex}.stock`}
                        className="block text-sm font-medium  mb-1"
                      >
                        Quantity
                      </Label>
                      <Input
                        id={`variants.${variantIndex}.stock`}
                        type="text"
                        inputMode="decimal"
                        placeholder="quantity"
                        // {...register(`variants.${variantIndex}.stock`)}
                        value={watchedVariants?.[variantIndex]?.stock ?? ""}
                        onChange={(e) =>
                          handlePriceChange({
                            index: variantIndex,
                            field: "stock",
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-1">
                      <Label
                        htmlFor={`variants.${variantIndex}.price`}
                        className="block text-sm font-medium  mb-1"
                      >
                        Price <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`variants.${variantIndex}.price`}
                        type="text"
                        inputMode="numeric"
                        placeholder="Price"
                        // {...register(`variants.${variantIndex}.price`)}
                        value={watchedVariants?.[variantIndex]?.price ?? ""}
                        onChange={(e) =>
                          handlePriceChange({
                            index: variantIndex,
                            field: "price",
                            value: e.target.value,
                          })
                        }
                        className={cn(
                          "w-full px-4 py-2 border rounded-md",
                          getErrorMessage(`variants.${variantIndex}.price`) &&
                            "border-red-500"
                        )}
                      />
                      {getErrorMessage(`variants.${variantIndex}.price`) && (
                        <p className="text-red-500 text-sm mt-1">
                          {getErrorMessage(`variants.${variantIndex}.price`)}
                        </p>
                      )}
                    </div>

                    {/* Sale Price */}
                    <div className="col-span-1">
                      <Label
                        htmlFor={`variants.${variantIndex}.salePrice`}
                        className="block text-sm font-medium  mb-1"
                      >
                        Sale Price
                      </Label>
                      <Input
                        id={`variants.${variantIndex}.salePrice`}
                        type="text"
                        inputMode="decimal"
                        placeholder="Sale Price"
                        disabled={!hasPrice}
                        // {...register(`variants.${variantIndex}.salePrice`)}
                        value={watchedVariants?.[variantIndex]?.salePrice ?? ""}
                        onChange={(e) =>
                          handlePriceChange({
                            index: variantIndex,
                            field: "salePrice",
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:dark:bg-gray-800"
                      />
                    </div>

                    {/* Sales Start Date */}
                    <div className="col-span-1">
                      <Label
                        htmlFor={`variants.${variantIndex}.saleStartDate`}
                        className="block text-sm font-medium  mb-1"
                      >
                        Sale Start Date
                      </Label>
                      {/* <Input
                        id={`variants.${variantIndex}.saleStartDate`}
                        type="datetime-local"
                        placeholder="Sale Price"
                        disabled={!hasSalePrice}
                        {...register(`variants.${variantIndex}.saleStartDate`)}
                        className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:dark:bg-gray-800"
                      /> */}
                      <Popover>
                        <PopoverTrigger asChild disabled={!hasSalePrice}>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white",
                              !watchedVariants?.[variantIndex]?.saleStartDate &&
                                "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                            {watchedVariants?.[variantIndex]?.saleStartDate ? (
                              format(
                                watchedVariants[variantIndex].saleStartDate!,
                                "PPP HH:mm"
                              )
                            ) : (
                              <span>Pick a start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 flex items-start"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              watchedVariants?.[variantIndex]?.saleStartDate
                            }
                            onSelect={(date) =>
                              setValue(
                                `variants.${variantIndex}.saleStartDate`,
                                date
                              )
                            }
                            // initialFocus
                          />
                          <div className="p-3 border-t flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <Input
                              type="time"
                              className="h-8"
                              defaultValue={`${hour}:${minute}:${seconds}`}
                              onChange={(e) => {
                                const [hours, minutes] =
                                  e.target.value.split(":");
                                const date =
                                  watchedVariants?.[variantIndex]
                                    ?.saleStartDate || new Date();
                                date.setHours(
                                  parseInt(hours),
                                  parseInt(minutes)
                                );
                                setValue(
                                  `variants.${variantIndex}.saleStartDate`,
                                  new Date(date)
                                );
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Sales End Date */}
                    <div className="col-span-1">
                      <Label
                        htmlFor={`variants.${variantIndex}.saleEndDate`}
                        className="block text-sm font-medium  mb-1"
                      >
                        Sale End Date
                      </Label>
                      {/* <Input
                        id={`variants.${variantIndex}.saleEndDate`}
                        type="datetime-local"
                        disabled={!hasSalePrice}
                        placeholder="Sale end date"
                        {...register(`variants.${variantIndex}.saleEndDate`)}
                        className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:dark:bg-gray-800"
                      /> */}

                      <Popover>
                        <PopoverTrigger asChild disabled={!hasSalePrice}>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white",
                              !watchedVariants?.[variantIndex]?.saleEndDate &&
                                "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-rose-500" />
                            {watchedVariants?.[variantIndex]?.saleEndDate ? (
                              format(
                                watchedVariants[variantIndex].saleEndDate!,
                                "PPP HH:mm"
                              )
                            ) : (
                              <span>Pick an end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 flex items-start"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={
                              watchedVariants?.[variantIndex]?.saleEndDate
                            }
                            onSelect={(date) =>
                              setValue(
                                `variants.${variantIndex}.saleEndDate`,
                                date
                              )
                            }
                            initialFocus
                          />
                          <div className="p-3 border-t flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <Input
                              type="time"
                              className="h-8"
                              defaultValue={`${hour}:${minute}:${seconds}`}
                              onChange={(e) => {
                                const [hours, minutes] =
                                  e.target.value.split(":");
                                const date =
                                  watchedVariants?.[variantIndex]
                                    ?.saleEndDate || new Date();
                                date.setHours(
                                  parseInt(hours),
                                  parseInt(minutes)
                                );
                                setValue(
                                  `variants.${variantIndex}.saleEndDate`,
                                  new Date(date)
                                );
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex justify-end items-end fex-row w-full">
                    {variantFields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeVariant(variantIndex)}
                        className=" h-8 w-8 rounded-full"
                        title="Remove variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Separator />
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() => appendVariant(initialNewVariant)}
              className="mt-4 flex items-center text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
            </Button>
          </div>
        )}

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
