// components/store/StoreDetailsStep.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React from "react";

interface StoreDetailsStepProps {
  formData: any; // Use a more specific type if you prefer
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors: { [key: string]: string };
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
}

export function StoreDetailsStep({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
}: StoreDetailsStepProps) {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error for the field as user types
    if (validationErrors[id]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Store Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., My Awesome Shop"
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
            validationErrors.name
              ? "border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500"
          }`}
        />
        {validationErrors.name && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
        )}
      </div>

      <div>
        <Label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Tell us about your store..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <Label
          htmlFor="logo"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Logo URL (Optional)
        </Label>
        <Input
          id="logo"
          type="url"
          value={formData.logo}
          onChange={handleInputChange}
          placeholder="e.g., https://example.com/your-logo.png"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {formData.logo && (
          <div className="mt-2 text-center">
            <img
              src={formData.logo}
              alt="Store Logo Preview"
              className="max-w-[100px] h-auto mx-auto rounded-md border border-gray-200 shadow-sm"
            />
          </div>
        )}
      </div>

      {/*
        Regarding "category of product they want to sell":
        If this means the primary category the *store* operates in, you might add a Select here.
        However, the current schema doesn't link `Store` to `Category`.
        Products, however, do have categories. So, we'll address product categories in the next step.
        If you want the Store to have a primary category, you'd need to add `categoryId: String?`
        and `@relation` to your `Store` model, and then fetch categories here.
      */}
    </div>
  );
}
