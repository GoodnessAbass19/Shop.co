// components/store/ProductDetailsStep.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  MinusCircle,
  Trash2,
  Image as ImageIcon,
  Tags,
  Minus,
  Plus,
  Loader2,
} from "lucide-react"; // Icons
import React, { useCallback, useId, useEffect, useState } from "react"; // Added useId
import { useQuery } from "@tanstack/react-query"; // To fetch categories

// Define types for data within this step
interface ProductData {
  tempId: string;
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
    tempId: string;
    size: string | null;
    color: string | null;
    price: number;
    stock: number;
    sku?: string;
  }>;
}

interface ProductDetailsStepProps {
  formData: any; // Full MultiStepStoreForm formData
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors: { [key: string]: string };
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
}

// Function to fetch categories (similar to your ProductGrid's category fetching)
const fetchCategories = async () => {
  const res = await fetch("/api/categories"); // Assuming you have a /api/categories endpoint
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch categories.");
  }
  return res.json(); // Assuming it returns an array of categories
};

export function ProductDetailsStep({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
}: ProductDetailsStepProps) {
  // Fetch categories using React Query
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const getNextTempId = () =>
    `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const updateProductField = useCallback(
    (productTempId: string, field: keyof ProductData, value: any) => {
      setFormData((prev: { products: ProductData[] }) => ({
        ...prev,
        products: prev.products.map((p: ProductData) =>
          p.tempId === productTempId ? { ...p, [field]: value } : p
        ),
      }));
      // Clear validation error for this specific field
      const errorKey = `product-${formData.products.findIndex(
        (p: ProductData) => p.tempId === productTempId
      )}-${field}`;
      if (validationErrors[errorKey]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [setFormData, validationErrors, setValidationErrors, formData.products]
  );

  const updateVariantField = useCallback(
    (
      productTempId: string,
      variantTempId: string,
      field: keyof ProductData["variants"][0],
      value: any
    ) => {
      setFormData((prev: { products: ProductData[] }) => ({
        ...prev,
        products: prev.products.map((p: ProductData) =>
          p.tempId === productTempId
            ? {
                ...p,
                variants: p.variants.map((v) =>
                  v.tempId === variantTempId ? { ...v, [field]: value } : v
                ),
              }
            : p
        ),
      }));
      // Clear validation error for this specific field
      const productIdx = formData.products.findIndex(
        (p: ProductData) => p.tempId === productTempId
      );
      const variantIdx = formData.products[productIdx]?.variants.findIndex(
        (v: ProductData["variants"][0]) => v.tempId === variantTempId
      );
      const errorKey = `product-${productIdx}-variant-${variantIdx}-${field}`;
      if (validationErrors[errorKey]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [setFormData, validationErrors, setValidationErrors, formData.products]
  );

  const addProduct = useCallback(() => {
    setFormData((prev: { products: any }) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          tempId: getNextTempId(),
          name: "",
          description: "",
          price: 0,
          images: [],
          categoryId: "",
          stock: 0,
          variants: [
            {
              tempId: getNextTempId(),
              size: null,
              color: null,
              price: 0,
              stock: 0,
            },
          ],
        },
      ],
    }));
  }, [setFormData]);

  const removeProduct = useCallback(
    (productTempId: string) => {
      setFormData((prev: { products: any[] }) => ({
        ...prev,
        products: prev.products.filter(
          (p: ProductData) => p.tempId !== productTempId
        ),
      }));
      // Clear any validation errors related to this product
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (
            key.startsWith(
              `product-${formData.products.findIndex(
                (p: ProductData) => p.tempId === productTempId
              )}-`
            )
          ) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    },
    [setFormData, setValidationErrors, formData.products]
  );

  const addVariant = useCallback(
    (productTempId: string) => {
      setFormData((prev: { products: ProductData[] }) => ({
        ...prev,
        products: prev.products.map((p: ProductData) =>
          p.tempId === productTempId
            ? {
                ...p,
                variants: [
                  ...p.variants,
                  {
                    tempId: getNextTempId(),
                    size: null,
                    color: null,
                    price: 0,
                    stock: 0,
                  },
                ],
              }
            : p
        ),
      }));
    },
    [setFormData]
  );

  const removeVariant = useCallback(
    (productTempId: string, variantTempId: string) => {
      setFormData((prev: { products: ProductData[] }) => ({
        ...prev,
        products: prev.products.map((p: ProductData) =>
          p.tempId === productTempId
            ? {
                ...p,
                variants: p.variants.filter((v) => v.tempId !== variantTempId),
              }
            : p
        ),
      }));
      // Clear any validation errors related to this variant
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        const productIdx = formData.products.findIndex(
          (p: ProductData) => p.tempId === productTempId
        );
        Object.keys(newErrors).forEach((key) => {
          if (
            key.startsWith(
              `product-${productIdx}-variant-${formData.products[
                productIdx
              ]?.variants.findIndex(
                (v: ProductData["variants"][0]) => v.tempId === variantTempId
              )}-`
            )
          ) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    },
    [setFormData, setValidationErrors, formData.products]
  );

  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin mr-2" /> Loading categories...
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
    <div className="space-y-10">
      {formData.products.map((product: ProductData, pIdx: number) => (
        <div
          key={product.tempId}
          className="border p-6 rounded-lg shadow-sm bg-gray-50 relative"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
            Product #{pIdx + 1}
            {formData.products.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeProduct(product.tempId)}
                className="text-red-500 hover:text-red-700"
                title="Remove product"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor={`product-${pIdx}-name`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`product-${pIdx}-name`}
                type="text"
                value={product.name}
                onChange={(e) =>
                  updateProductField(product.tempId, "name", e.target.value)
                }
                placeholder="e.g., Summer T-Shirt"
                required
                className={
                  validationErrors[`product-${pIdx}-name`]
                    ? "border-red-500"
                    : "border-gray-300"
                }
              />
              {validationErrors[`product-${pIdx}-name`] && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors[`product-${pIdx}-name`]}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor={`product-${pIdx}-price`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Base Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`product-${pIdx}-price`}
                type="number"
                step="0.01"
                min="0"
                value={product.price}
                onChange={(e) =>
                  updateProductField(
                    product.tempId,
                    "price",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
                required
                className={
                  validationErrors[`product-${pIdx}-price`]
                    ? "border-red-500"
                    : "border-gray-300"
                }
              />
              {validationErrors[`product-${pIdx}-price`] && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors[`product-${pIdx}-price`]}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label
                htmlFor={`product-${pIdx}-description`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (Optional)
              </Label>
              <Textarea
                id={`product-${pIdx}-description`}
                value={product.description}
                onChange={(e) =>
                  updateProductField(
                    product.tempId,
                    "description",
                    e.target.value
                  )
                }
                placeholder="A brief description of the product..."
                rows={3}
                className="resize-y"
              />
            </div>

            <div className="col-span-2">
              <Label
                htmlFor={`product-${pIdx}-images`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Image URLs (comma-separated)
              </Label>
              <Input
                id={`product-${pIdx}-images`}
                type="text"
                value={product.images.join(", ")}
                onChange={(e) =>
                  updateProductField(
                    product.tempId,
                    "images",
                    e.target.value
                      .split(",")
                      .map((url) => url.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="https://img1.com/a.jpg, https://img2.com/b.jpg"
                className={
                  validationErrors[`product-${pIdx}-images`]
                    ? "border-red-500"
                    : "border-gray-300"
                }
              />
              {validationErrors[`product-${pIdx}-images`] && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors[`product-${pIdx}-images`]}
                </p>
              )}
              {product.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.images.map((img, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={img}
                      alt={`Product ${pIdx} Image ${imgIdx}`}
                      className="w-16 h-16 object-cover rounded-md border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Category Select */}
            <div>
              <Label
                htmlFor={`product-${pIdx}-categoryId`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={product.categoryId}
                onValueChange={(value) =>
                  updateProductField(product.tempId, "categoryId", value)
                }
              >
                <SelectTrigger
                  className={
                    validationErrors[`product-${pIdx}-categoryId`]
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors[`product-${pIdx}-categoryId`] && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors[`product-${pIdx}-categoryId`]}
                </p>
              )}
            </div>

            {/* Overall Product Stock (optional, if you track overall stock vs. just variants) */}
            <div>
              <Label
                htmlFor={`product-${pIdx}-stock`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Overall Stock
              </Label>
              <Input
                id={`product-${pIdx}-stock`}
                type="number"
                min="0"
                value={product.stock}
                onChange={(e) =>
                  updateProductField(
                    product.tempId,
                    "stock",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
              />
            </div>
            {/* isFeatured checkbox could go here too */}
          </div>

          {/* Variants Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              Product Variants <Tags className="ml-2 h-5 w-5 text-gray-500" />
              {validationErrors[`product-${pIdx}-variants`] && (
                <p className="text-red-500 text-sm ml-2">
                  {validationErrors[`product-${pIdx}-variants`]}
                </p>
              )}
            </h4>

            {product.variants.map((variant, vIdx) => (
              <div
                key={variant.tempId}
                className="flex flex-wrap items-end gap-3 p-4 border rounded-md mb-4 bg-white shadow-sm"
              >
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label
                      htmlFor={`product-${pIdx}-variant-${vIdx}-size`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Size (Optional)
                    </Label>
                    <Input
                      id={`product-${pIdx}-variant-${vIdx}-size`}
                      type="text"
                      value={variant.size || ""}
                      onChange={(e) =>
                        updateVariantField(
                          product.tempId,
                          variant.tempId,
                          "size",
                          e.target.value
                        )
                      }
                      placeholder="e.g., M, XL"
                      className={
                        validationErrors[
                          `product-${pIdx}-variant-${vIdx}-attributes`
                        ]
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                    {validationErrors[
                      `product-${pIdx}-variant-${vIdx}-attributes`
                    ] &&
                      !variant.color && (
                        <p className="text-red-500 text-sm mt-1">
                          Size or color needed
                        </p>
                      )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`product-${pIdx}-variant-${vIdx}-color`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Color (Optional)
                    </Label>
                    <Input
                      id={`product-${pIdx}-variant-${vIdx}-color`}
                      type="text"
                      value={variant.color || ""}
                      onChange={(e) =>
                        updateVariantField(
                          product.tempId,
                          variant.tempId,
                          "color",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Red, Blue"
                      className={
                        validationErrors[
                          `product-${pIdx}-variant-${vIdx}-attributes`
                        ]
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                    {validationErrors[
                      `product-${pIdx}-variant-${vIdx}-attributes`
                    ] &&
                      !variant.size && (
                        <p className="text-red-500 text-sm mt-1">
                          Size or color needed
                        </p>
                      )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`product-${pIdx}-variant-${vIdx}-price`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Variant Price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`product-${pIdx}-variant-${vIdx}-price`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariantField(
                          product.tempId,
                          variant.tempId,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      required
                      className={
                        validationErrors[
                          `product-${pIdx}-variant-${vIdx}-price`
                        ]
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                    {validationErrors[
                      `product-${pIdx}-variant-${vIdx}-price`
                    ] && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          validationErrors[
                            `product-${pIdx}-variant-${vIdx}-price`
                          ]
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor={`product-${pIdx}-variant-${vIdx}-stock`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Variant Stock <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`product-${pIdx}-variant-${vIdx}-stock`}
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariantField(
                          product.tempId,
                          variant.tempId,
                          "stock",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      required
                      className={
                        validationErrors[
                          `product-${pIdx}-variant-${vIdx}-stock`
                        ]
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                    {validationErrors[
                      `product-${pIdx}-variant-${vIdx}-stock`
                    ] && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          validationErrors[
                            `product-${pIdx}-variant-${vIdx}-stock`
                          ]
                        }
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor={`product-${pIdx}-variant-${vIdx}-sku`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      SKU (Optional)
                    </Label>
                    <Input
                      id={`product-${pIdx}-variant-${vIdx}-sku`}
                      type="text"
                      value={variant.sku || ""}
                      onChange={(e) =>
                        updateVariantField(
                          product.tempId,
                          variant.tempId,
                          "sku",
                          e.target.value
                        )
                      }
                      placeholder="e.g., TSHIRT-M-RED-001"
                    />
                  </div>
                </div>

                {product.variants.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeVariant(product.tempId, variant.tempId)
                    }
                    className="flex-shrink-0 text-red-500 hover:text-red-700 self-end"
                    title="Remove variant"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => addVariant(product.tempId)}
              className="flex items-center gap-1 text-gray-700 hover:text-blue-600 border-dashed border-2 hover:border-blue-300"
            >
              <PlusCircle className="h-4 w-4" /> Add Another Variant
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addProduct}
        className="w-full flex items-center gap-2 py-3 text-lg font-bold border-2 border-dashed border-gray-400 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors"
      >
        <PlusCircle className="h-5 w-5" /> Add Another Product
      </Button>

      {validationErrors.products && (
        <p className="text-red-500 text-sm mt-2">{validationErrors.products}</p>
      )}
    </div>
  );
}
