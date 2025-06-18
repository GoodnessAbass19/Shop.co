// components/store/MultiStepStoreCreationForm.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react"; // Icons for navigation

// Import Step Components (will create these below)
import { StoreDetailsStep } from "./StoreDetailsStep";
import { ProductDetailsStep } from "./ProductDetailsStep";

// Define the overall shape of the form data
interface StoreFormData {
  name: string;
  description?: string;
  logo?: string;
  // This will hold an array of products, each with its own variants
  products: Array<{
    tempId: string; // Temporary ID for client-side keying and tracking
    name: string;
    description?: string;
    price: number;
    images: string[];
    categoryId: string; // Product needs a category
    subCategoryId?: string;
    subSubCategoryId?: string;
    stock: number; // Overall product stock for now, or sum of variant stock
    isFeatured?: boolean;
    variants: Array<{
      tempId: string; // Temporary ID for client-side keying
      size: string | null;
      color: string | null;
      price: number; // Variant specific price
      stock: number; // Variant stock
      sku?: string; // Optional SKU for variant
    }>;
  }>;
}

export function MultiStepStoreCreationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<StoreFormData>({
    name: "",
    description: "",
    logo: "",
    products: [
      {
        // Start with one empty product
        tempId: `product-${Date.now()}-0`, // Client-side unique ID
        name: "",
        description: "",
        price: 0,
        images: [],
        categoryId: "",
        stock: 0,
        variants: [
          {
            // Start with one empty variant
            tempId: `variant-${Date.now()}-0`, // Client-side unique ID
            size: null,
            color: null,
            price: 0,
            stock: 0,
          },
        ],
      },
    ],
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const steps = useMemo(
    () => [
      { title: "Store Details", component: StoreDetailsStep },
      { title: "Add Products", component: ProductDetailsStep },
      // Add more steps here if needed, e.g., 'Review & Publish'
    ],
    []
  );

  const handleNext = useCallback(() => {
    // Basic validation for the current step before proceeding
    let errors: { [key: string]: string } = {};
    if (currentStep === 0) {
      // Store Details Step
      if (!formData.name.trim()) {
        errors.name = "Store name is required.";
      }
      // Add more validation for Step 1 here
    } else if (currentStep === 1) {
      // Product Details Step
      // Basic validation: ensure at least one product with a name and price
      if (formData.products.length === 0) {
        errors.products = "At least one product is required.";
      } else {
        formData.products.forEach((product, pIdx) => {
          if (!product.name.trim()) {
            errors[`product-${pIdx}-name`] = `Product #${
              pIdx + 1
            } name is required.`;
          }
          if (product.price <= 0) {
            errors[`product-${pIdx}-price`] = `Product #${
              pIdx + 1
            } price must be greater than 0.`;
          }
          if (!product.categoryId) {
            errors[`product-${pIdx}-categoryId`] = `Product #${
              pIdx + 1
            } category is required.`;
          }
          if (product.images.length === 0) {
            errors[`product-${pIdx}-images`] = `Product #${
              pIdx + 1
            } requires at least one image URL.`;
          }

          // Validate variants
          if (product.variants.length === 0) {
            errors[`product-${pIdx}-variants`] = `Product #${
              pIdx + 1
            } needs at least one variant.`;
          } else {
            product.variants.forEach((variant, vIdx) => {
              if (variant.price <= 0) {
                errors[`product-${pIdx}-variant-${vIdx}-price`] = `Variant #${
                  vIdx + 1
                } price must be greater than 0.`;
              }
              if (variant.stock < 0) {
                errors[`product-${pIdx}-variant-${vIdx}-stock`] = `Variant #${
                  vIdx + 1
                } stock cannot be negative.`;
              }
              if (!variant.size && !variant.color) {
                errors[
                  `product-${pIdx}-variant-${vIdx}-attributes`
                ] = `Variant #${vIdx + 1} needs at least a size or color.`;
              }
            });
          }
        });
      }
      // Add more validation for Step 2 here
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleSubmit(); // If it's the last step, submit the form
      }
    } else {
      alert("Please correct the errors before proceeding.");
      // You might want to scroll to the first error or highlight fields
    }
  }, [currentStep, formData, steps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const createStoreMutation = useMutation({
    mutationFn: async (fullFormData: StoreFormData) => {
      // Prepare data for the API (remove tempIds, adjust structure for Prisma nested writes)
      const dataToSend = {
        name: fullFormData.name,
        description: fullFormData.description,
        logo: fullFormData.logo,
        products: fullFormData.products.map((product) => ({
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images,
          categoryId: product.categoryId,
          subCategoryId: product.subCategoryId,
          subSubCategoryId: product.subSubCategoryId,
          stock: product.stock,
          isFeatured: product.isFeatured,
          variants: product.variants.map((variant) => ({
            size: variant.size,
            color: variant.color,
            price: variant.price,
            stock: variant.stock,
            sku: variant.sku,
          })),
        })),
      };

      const res = await fetch("/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to create store and products."
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ["userStore"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      router.push(`/seller/dashboard`); // Redirect to seller dashboard or new store page
    },
    onError: (error: Error) => {
      alert(`Error during final submission: ${error.message}`);
    },
  });

  const handleSubmit = useCallback(() => {
    createStoreMutation.mutate(formData);
  }, [formData, createStoreMutation]);

  const CurrentStepComponent = steps[currentStep].component;
  const isSubmitting = createStoreMutation.isPending;

  return (
    <div className="max-w-screen-xl w-full mx-auto p-8 bg-white rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {steps[currentStep].title}
      </h2>

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-5 items-center mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                index === currentStep
                  ? "bg-blue-600"
                  : index < currentStep
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >
              {index < currentStep ? "✔" : index + 1}
            </div>
            <p
              className={`text-sm mt-2 ${
                index === currentStep
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <CurrentStepComponent
        formData={formData}
        setFormData={setFormData}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
      />

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
        <div className="flex-grow flex justify-end">
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Submitting...
              </>
            ) : (
              <>
                {currentStep < steps.length - 1 ? "Next" : "Create Store"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
