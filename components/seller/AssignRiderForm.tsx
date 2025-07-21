// components/seller/AssignRiderForm.tsx
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
import { DialogClose } from "../ui/dialog";
import { useRouter } from "next/navigation";

// Define the shape of the form data
interface AssignRiderFormData {
  riderName: string;
  riderPhone: string;
  trackingUrl?: string; // Optional field for tracking URL
}

// Define props for the component
interface AssignRiderFormProps {
  orderItemId: string; // The ID of the order item to assign a rider to
  // Optional callback to close a parent modal/dialog or refetch data
  onSuccess?: () => void;
}

// API function to assign a rider
// This function will send rider details and trigger notifications.
// IMPORTANT: This assumes your backend API at /api/order-items/[orderItemId]/assign-rider
// handles sending SMS/email and does NOT store rider details in the database,
// as per your requirement.
const assignRider = async ({
  orderItemId,
  riderName,
  riderPhone,
  trackingUrl,
}: {
  orderItemId: string;
  riderName: string;
  riderPhone: string;
  trackingUrl?: string; // Optional tracking URL
}) => {
  const res = await fetch(`/api/store/orders/item/${orderItemId}/`, {
    method: "PATCH", // Or POST, depending on your API design for this action
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ riderName, riderPhone, trackingUrl }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to assign rider.");
  }
  return res.json();
};

export function AssignRiderForm({
  orderItemId,
  onSuccess,
}: AssignRiderFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignRiderFormData>({
    defaultValues: {
      riderName: "",
      riderPhone: "",
      trackingUrl: "", // Optional field, can be left empty
    },
    mode: "onBlur", // Validate on blur
  });

  // Setup react-query mutation
  const assignRiderMutation = useMutation({
    mutationFn: assignRider,
    onSuccess: () => {
      toast({
        title: "Rider Assigned",
        description: "Rider details sent and buyer notified.",
      });
      router.refresh();
      reset(); // Clear form fields on success
      onSuccess?.(); // Call the optional success callback
      // Invalidate relevant queries if this action affects other data
      // e.g., queryClient.invalidateQueries(['orderDetails', orderItemId]);
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Could not assign rider.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AssignRiderFormData) => {
    assignRiderMutation.mutate({ orderItemId, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <h3 className="text-lg font-semibold text-gray-800">Assign Rider</h3>

      {/* Rider Name Input */}
      <div>
        <Label
          htmlFor="riderName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Rider Name
        </Label>
        <Input
          id="riderName"
          type="text"
          placeholder="Enter rider's name"
          {...register("riderName", { required: "Rider name is required." })}
          className={cn(
            "w-full px-4 py-2 border rounded-md",
            errors.riderName && "border-red-500"
          )}
          disabled={isSubmitting}
        />
        {errors.riderName && (
          <p className="text-red-500 text-sm mt-1">
            {errors.riderName.message}
          </p>
        )}
      </div>

      {/* Rider Phone Input */}
      <div>
        <Label
          htmlFor="riderPhone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Rider Phone Number
        </Label>
        <Input
          id="riderPhone"
          type="tel"
          placeholder="e.g., +1234567890"
          {...register("riderPhone", {
            required: "Rider phone number is required.",
          })}
          className={cn(
            "w-full px-4 py-2 border rounded-md",
            errors.riderPhone && "border-red-500"
          )}
          disabled={isSubmitting}
        />
        {errors.riderPhone && (
          <p className="text-red-500 text-sm mt-1">
            {errors.riderPhone.message}
          </p>
        )}
      </div>

      {/* Tracking URL */}
      <div>
        <Label
          htmlFor="riderPhone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tracking URL (optional){" "}
          {/* This field is optional, so we don't register it */}
        </Label>
        <Input
          id="trackingUrl   "
          type="url"
          placeholder="e.g., https://tracking.example.com/12345"
          {...register("trackingUrl", {
            // required: "Rider phone number is required.",
          })}
          className={cn("w-full px-4 py-2 border rounded-md")}
          disabled={isSubmitting}
        />
        {/* {errors.riderPhone && (
          <p className="text-red-500 text-sm mt-1">
            {errors.riderPhone.message}
          </p>
        )} */}
      </div>

      {/* Submit Button */}
      <DialogClose onClick={handleSubmit(onSubmit)}>
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" /> Assigning...
            </>
          ) : (
            "Assign Rider"
          )}
        </Button>
      </DialogClose>
    </form>
  );
}
