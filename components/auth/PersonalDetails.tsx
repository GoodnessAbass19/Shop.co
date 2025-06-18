"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { User, Calendar, CircleUser } from "lucide-react"; // Icons

interface StepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors: { [key: string]: string };
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
}

export function PersonalDetailsStep({
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

  const handleSelectChange = (name: string, value: string) => {
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
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Full Name <span className="text-red-500">*</span>
        </Label>
        <div className="relative flex items-center">
          <User className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        {validationErrors.name && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
        )}
      </div>

      <div>
        <Label
          htmlFor="gender"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Gender (Optional)
        </Label>
        <Select
          value={formData.gender || ""}
          onValueChange={(value) => handleSelectChange("gender", value)}
        >
          <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <CircleUser className="absolute left-3 h-5 w-5 text-gray-400" />
            <span className="pl-7">
              <SelectValue placeholder="Select Gender" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
            <SelectItem value="OTHER">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label
          htmlFor="birthDate"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Birth Date (Optional)
        </Label>
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            id="birthDate"
            name="birthDate"
            type="date" // HTML5 date input
            value={formData.birthDate}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
