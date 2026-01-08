// components/store/MultiStepStoreCreationForm.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useForm, FieldErrors } from "react-hook-form"; // Import useForm and FieldErrors

// Import Step Components
import { StoreDetailsStep } from "./StoreDetailsStep";
import { ProductDetailsStep } from "./ProductDetailsStep";

// Define the overall shape of the form data (matches backend payload)
// All fields that will be managed by react-hook-form
interface StoreFormData {
  name: string;
  description?: string;
  logo: string; // URL after upload
  banners: string[]; // URLs after upload
  products: Array<{
    // No tempId here, as it's for internal UI management
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
      // No tempId here
      size: string | null;
      color: string | null;
      price: number;
      stock: number;
      sku?: string;
    }>;
  }>;
}

// Initial product state for when a new product is added
const initialNewProduct = {
  name: "",
  description: "",
  price: 0,
  images: [],
  categoryId: "",
  stock: 0,
  variants: [{ size: null, color: null, price: 0, stock: 0 }],
};

export function MultiStepStoreCreationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);

  // Centralized react-hook-form instance
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control, // For controlled components in steps
    getValues,
    trigger, // For manual validation of specific fields/steps
    formState: { errors },
  } = useForm<StoreFormData>({
    defaultValues: {
      name: "",
      description: "",
      logo: "",
      banners: [],
      products: [
        {
          // Start with one empty product
          name: "",
          description: "",
          price: 0,
          images: [],
          categoryId: "",
          stock: 0,
          variants: [{ size: null, color: null, price: 0, stock: 0 }],
        },
      ],
    },
    mode: "onBlur", // Validate on blur for better UX
    resolver: async (data) => {
      // Manual resolver for more complex validation across steps
      let stepErrors: FieldErrors<StoreFormData> = {};
      let isValid = true;

      // Validate based on current step
      if (currentStep === 0) {
        // Store Details Step
        if (!data.name?.trim()) {
          stepErrors.name = {
            type: "required",
            message: "Store name is required.",
          };
          isValid = false;
        }
        if (!data.logo) {
          stepErrors.logo = {
            type: "required",
            message: "Store logo is required.",
          };
          isValid = false;
        }
        if (!data.banners || data.banners.length === 0) {
          stepErrors.banners = {
            type: "required",
            message: "At least one banner image is required.",
          };
          isValid = false;
        }
      } else if (currentStep === 1) {
        // Product Details Step
        if (!data.products || data.products.length === 0) {
          stepErrors.products = {
            type: "required",
            message: "At least one product is required.",
          };
          isValid = false;
        } else {
          data.products.forEach((product, pIdx) => {
            if (!product.name?.trim()) {
              (stepErrors as any)[`products.${pIdx}.name`] = {
                type: "required",
                message: `Product #${pIdx + 1} name is required.`,
              };
              isValid = false;
            }
            if (!product.price || product.price <= 0) {
              (stepErrors as any)[`products.${pIdx}.price`] = {
                type: "min",
                message: `Product #${pIdx + 1} price must be greater than 0.`,
              };
              isValid = false;
            }
            if (!product.categoryId) {
              (stepErrors as any)[`products.${pIdx}.categoryId`] = {
                type: "required",
                message: `Product #${pIdx + 1} category is required.`,
              };
              isValid = false;
            }
            if (!product.images || product.images.length === 0) {
              (stepErrors as any)[`products.${pIdx}.images`] = {
                type: "required",
                message: `Product #${
                  pIdx + 1
                } requires at least one image URL.`,
              };
              isValid = false;
            }

            if (!product.variants || product.variants.length === 0) {
              (stepErrors as any)[`products.${pIdx}.variants`] = {
                type: "required",
                message: `Product #${pIdx + 1} needs at least one variant.`,
              };
              isValid = false;
            } else {
              product.variants.forEach((variant, vIdx) => {
                if (!variant.price || variant.price <= 0) {
                  (stepErrors as any)[
                    `products.${pIdx}.variants.${vIdx}.price`
                  ] = {
                    type: "min",
                    message: `Variant #${
                      vIdx + 1
                    } price must be greater than 0.`,
                  };
                  isValid = false;
                }
                if (variant.stock < 0) {
                  (stepErrors as any)[
                    `products.${pIdx}.variants.${vIdx}.stock`
                  ] = {
                    type: "min",
                    message: `Variant #${vIdx + 1} stock cannot be negative.`,
                  };
                  isValid = false;
                }
                if (!variant.size && !variant.color) {
                  (stepErrors as any)[
                    `products.${pIdx}.variants.${vIdx}.attributes`
                  ] = {
                    type: "required",
                    message: `Variant #${
                      vIdx + 1
                    } needs at least a size or color.`,
                  };
                  isValid = false;
                }
              });
            }
          });
        }
      }
      return { values: data, errors: stepErrors };
    },
  });

  const steps = useMemo(
    () => [
      {
        title: "Store Details",
        component: StoreDetailsStep,
        fields: ["name", "description", "logo", "banners"],
      },
      {
        title: "Add Products",
        component: ProductDetailsStep,
        fields: ["products"],
      },
    ],
    []
  );

  const handleNext = useCallback(async () => {
    // Manually trigger validation for the fields relevant to the current step
    const fieldsToValidate = steps[currentStep].fields;
    const isValid = await trigger(fieldsToValidate as any); // Type assertion needed for trigger

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // If it's the last step and valid, submit the form
        // handleSubmit directly on the final submit button in the form
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted fields before proceeding.",
        variant: "destructive",
        action: <ToastAction altText="Close">Dismiss</ToastAction>,
      });
    }
  }, [currentStep, steps, trigger, toast]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      // errors.clear(); // Cannot call clear on errors directly, react-hook-form manages it
    }
  }, [currentStep]);

  // Handle final form submission
  const onSubmit: (data: StoreFormData) => Promise<void> = async (data) => {
    // `data` here contains all the form values from react-hook-form
    createStoreMutation.mutate(data);
  };

  const createStoreMutation = useMutation({
    mutationFn: async (fullFormData: StoreFormData) => {
      // The data from `fullFormData` is already in the correct shape from react-hook-form
      // No need for mapping `tempId`s or deep cloning here anymore if ProductDetailsStep also uses central `useForm`
      const dataToSend = {
        name: fullFormData.name,
        description: fullFormData.description,
        logo: fullFormData.logo,
        banners: fullFormData.banners,
        products: fullFormData.products.map((product) => ({
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images,
          categoryId: product.categoryId,
          subCategoryId: product.subCategoryId || null,
          subSubCategoryId: product.subSubCategoryId || null,
          stock: product.stock,
          isFeatured: product.isFeatured || false,
          variants: product.variants.map((variant) => ({
            size: variant.size || null,
            color: variant.color || null,
            price: variant.price,
            stock: variant.stock,
            sku: variant.sku || null,
          })),
        })),
      };

      const res = await fetch("/api/store", {
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
      toast({
        title: "Store Created!",
        description: data.message,
        action: <ToastAction altText="OK">Dismiss</ToastAction>,
      });
      queryClient.invalidateQueries({ queryKey: ["userStore"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["sellerDashboard"] });
      router.push(`/seller/dashboard`);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  const CurrentStepComponent = steps[currentStep].component;
  const isSubmitting = createStoreMutation.isPending;

  return (
    <div className="w-full p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {steps[currentStep].title}
      </h2>

      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-8 relative px-4">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1 z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                  index === currentStep
                    ? "bg-blue-600 ring-4 ring-blue-200"
                    : index < currentStep
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              >
                {index < currentStep ? "✔" : index + 1}
              </div>
              <p
                className={`text-xs sm:text-sm mt-2 text-center transition-colors duration-300 ${
                  index === currentStep
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600"
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`absolute h-0.5 bg-gray-200 z-0`}
                style={{
                  left: `calc(${(index / (steps.length - 1)) * 100}% + 20px)`,
                  width: `calc(100% / ${steps.length - 1} - 40px)`,
                }}
              >
                <div
                  className={`h-full ${
                    index < currentStep ? "bg-green-500" : ""
                  } ${
                    index === currentStep ? "bg-blue-400 animate-pulse" : ""
                  }`}
                ></div>
              </div>
            )}
          </React.Fragment>
        ))}
        <div className="absolute top-[20px] left-1/2 transform -translate-x-1/2 w-[calc(100%-80px)] h-0.5 bg-gray-200 z-0">
          <div
            className={`h-full bg-blue-600 transition-all duration-500`}
            style={{
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Use a single form wrapper around all steps */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Render Current Step Content */}
        <CurrentStepComponent
          control={control}
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors} // Pass react-hook-form's errors
          // No need for formData, setFormData, validationErrors, setValidationErrors anymore
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          {currentStep > 0 && (
            <Button
              type="button" // Important: type="button" to prevent form submission
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center text-gray-700 hover:text-blue-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          <div className="flex-grow flex justify-end">
            <Button
              type={currentStep === steps.length - 1 ? "submit" : "button"} // Submit only on the last step
              onClick={
                // currentStep === steps.length - 1 ? undefined :
                handleNext
              } // Call handleNext for intermediate steps
              disabled={isSubmitting}
              className="flex items-center bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />{" "}
                  Submitting...
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
      </form>
    </div>
  );
}
