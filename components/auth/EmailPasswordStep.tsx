"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { Mail, Lock } from "lucide-react"; // Icons

interface StepProps {
  formData: any; // Use more specific type if preferred
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors: { [key: string]: string };
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
}

export function EmailPasswordStep({
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
}: StepProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    // Clear error for the field as user types
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
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </Label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            required
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        {validationErrors.email && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <Label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative flex items-center">
          <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="********"
            required
            minLength={6}
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.password ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        {validationErrors.password && (
          <p className="text-red-500 text-sm mt-1">
            {validationErrors.password}
          </p>
        )}
      </div>
    </div>
  );
}
