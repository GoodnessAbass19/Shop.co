"use client";

import React, { useCallback } from "react";
import {
  useFieldArray,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  Control,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tags, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ProductVariantsSectionProps {
  pIdx: number;
  control: Control<StoreFormData>;
  register: UseFormRegister<StoreFormData>;
  setValue: UseFormSetValue<StoreFormData>;
  watch: UseFormWatch<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
  renderError: (fieldPath: string) => React.ReactNode;
}

export function ProductVariantsSection({
  pIdx,
  control,
  register,
  setValue,
  watch,
  errors,
  renderError,
}: ProductVariantsSectionProps) {
  const {
    fields: variants,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `products.${pIdx}.variants` as const,
  });

  const addVariant = useCallback(() => {
    append({ size: null, color: null, price: 0, stock: 0, sku: "" });
  }, [append]);

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <Tags className="h-6 w-6 mr-3 text-gray-700" />
        Product Variants
      </h4>

      {/* Top-level error for variants array */}
      {renderError(`products.${pIdx}.variants`)}

      <div className="space-y-6">
        {variants.map((variant, vIdx) => (
          <div
            key={variant.id ?? `${pIdx}-${vIdx}`}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm relative"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h5 className="text-lg font-semibold text-gray-700">
                Variant #{vIdx + 1}
              </h5>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(vIdx)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  title="Remove variant"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Size */}
              <div>
                <Label htmlFor={`products.${pIdx}.variants.${vIdx}.size`}>
                  Size (Optional)
                </Label>
                <Input
                  id={`products.${pIdx}.variants.${vIdx}.size`}
                  type="text"
                  placeholder="e.g., M, XL"
                  {...register(`products.${pIdx}.variants.${vIdx}.size`)}
                  className={cn(
                    errors?.products?.[pIdx]?.variants?.[vIdx]?.size &&
                      "border-red-500 focus:ring-red-500"
                  )}
                />
                {renderError(`products.${pIdx}.variants.${vIdx}.size`)}
              </div>

              {/* Color */}
              <div>
                <Label htmlFor={`products.${pIdx}.variants.${vIdx}.color`}>
                  Color (Optional)
                </Label>
                <Input
                  id={`products.${pIdx}.variants.${vIdx}.color`}
                  type="text"
                  placeholder="e.g., Red, Blue"
                  {...register(`products.${pIdx}.variants.${vIdx}.color`)}
                  className={cn(
                    errors?.products?.[pIdx]?.variants?.[vIdx]?.color &&
                      "border-red-500 focus:ring-red-500"
                  )}
                />
                {renderError(`products.${pIdx}.variants.${vIdx}.color`)}
              </div>

              {/* Price */}
              <div>
                <Label htmlFor={`products.${pIdx}.variants.${vIdx}.price`}>
                  Variant Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`products.${pIdx}.variants.${vIdx}.price`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="29.99"
                  {...register(`products.${pIdx}.variants.${vIdx}.price`, {
                    required: "Variant price is required.",
                    valueAsNumber: true,
                    min: {
                      value: 0.01,
                      message: "Variant price must be greater than 0.",
                    },
                  })}
                  className={cn(
                    errors?.products?.[pIdx]?.variants?.[vIdx]?.price &&
                      "border-red-500 focus:ring-red-500"
                  )}
                />
                {renderError(`products.${pIdx}.variants.${vIdx}.price`)}
              </div>

              {/* Stock */}
              <div>
                <Label htmlFor={`products.${pIdx}.variants.${vIdx}.stock`}>
                  Variant Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`products.${pIdx}.variants.${vIdx}.stock`}
                  type="number"
                  min="0"
                  placeholder="50"
                  {...register(`products.${pIdx}.variants.${vIdx}.stock`, {
                    required: "Variant stock is required.",
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Stock must be 0 or more.",
                    },
                  })}
                  className={cn(
                    errors?.products?.[pIdx]?.variants?.[vIdx]?.stock &&
                      "border-red-500 focus:ring-red-500"
                  )}
                />
                {renderError(`products.${pIdx}.variants.${vIdx}.stock`)}
              </div>

              {/* SKU */}
              <div>
                <Label htmlFor={`products.${pIdx}.variants.${vIdx}.sku`}>
                  SKU (Optional)
                </Label>
                <Input
                  id={`products.${pIdx}.variants.${vIdx}.sku`}
                  type="text"
                  placeholder="TSHIRT-M-RED-001"
                  {...register(`products.${pIdx}.variants.${vIdx}.sku`)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="mt-6 w-full flex items-center gap-2 border-dashed border-2 border-blue-400 hover:border-blue-600 hover:bg-blue-50 transition-colors text-blue-600"
      >
        <PlusCircle className="h-4 w-4" /> Add Another Variant
      </Button>
    </div>
  );
}
