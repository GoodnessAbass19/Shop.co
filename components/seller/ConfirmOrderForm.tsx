// components/seller/ConfirmDeliveryForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/Hooks/use-toast"; // Assuming this is your shadcn toast hook
import { Loader2 } from "lucide-react"; // For loading indicator
import { cn } from "@/lib/utils"; // For conditional class names
import { useRouter } from "next/navigation";
import { DialogClose } from "../ui/dialog";

// Define the shape of the form data
interface ConfirmDeliveryFormData {
  code: string;
}

// Define props for the component
interface ConfirmDeliveryFormProps {
  orderItemId: string; // The ID of the order item to confirm delivery for
  // Optional callback to close a parent modal/dialog or refetch data
  onSuccess?: () => void;
}

// API function to confirm delivery
// IMPORTANT: You will need to implement this backend API route at
// /api/order-items/[orderItemId]/confirm-delivery to handle the confirmation logic.
const confirmDelivery = async ({
  orderItemId,
  code,
}: {
  orderItemId: string;
  code: string;
}) => {
  const res = await fetch(
    `/api/store/orders/item/${orderItemId}/confirm-delivery`,
    {
      method: "PATCH", // Or POST, depending on your API design
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to confirm delivery.");
  }
  return res.json();
};

export function ConfirmDeliveryForm({
  orderItemId,
  onSuccess,
}: ConfirmDeliveryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmDeliveryFormData>({
    defaultValues: {
      code: "",
    },
    mode: "onBlur", // Validate on blur
  });

  // Setup react-query mutation
  const confirmDeliveryMutation = useMutation({
    mutationFn: confirmDelivery,
    onSuccess: () => {
      toast({
        title: "Delivery Confirmed",
        description: "Order delivery has been successfully confirmed.",
      });
      router.refresh();
      reset(); // Clear form fields on success
      onSuccess?.(); // Call the optional success callback
      // Refresh the page or data
      // Invalidate relevant queries if this action affects other data
      // e.g., queryClient.invalidateQueries(['orderDetails', orderItemId]);
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description:
          error.message ||
          "Invalid code or an error occurred during confirmation.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ConfirmDeliveryFormData) => {
    confirmDeliveryMutation.mutate({ orderItemId, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <h3 className="text-lg font-semibold text-gray-800">Confirm Delivery</h3>

      {/* Confirmation Code Input */}
      <div>
        <Label
          htmlFor="code"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirmation Code
        </Label>
        <Input
          id="code"
          type="text"
          placeholder="Enter confirmation code"
          {...register("code", { required: "Confirmation code is required." })}
          className={cn(
            "w-full px-4 py-2 border rounded-md",
            errors.code && "border-red-500"
          )}
          disabled={isSubmitting}
        />
        {errors.code && (
          <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <DialogClose>
        <Button
          type="submit"
          className="w-full bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" /> Verifying...
            </>
          ) : (
            "Confirm Delivery"
          )}
        </Button>
      </DialogClose>
    </form>
  );
}
