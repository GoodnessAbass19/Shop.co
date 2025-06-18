"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { Phone } from "lucide-react"; // Icon

interface StepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors: { [key: string]: string };
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
}

export function ContactInfoStep({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
}: StepProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Phone Number (Optional)
        </Label>
        <div className="relative flex items-center">
          <Phone className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            id="phone"
            name="phone"
            type="tel" // Semantic type for phone numbers
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="e.g., +1234567890"
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.phone ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        {validationErrors.phone && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          This will be used for delivery updates and account recovery.
        </p>
      </div>
    </div>
  );
}
