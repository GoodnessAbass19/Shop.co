// components/user/AddressFormModal.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Added for accessibility and description
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Added Label for accessibility
import { useMutation } from "@tanstack/react-query"; // Use useMutation for API calls
import { ToastAction } from "@/components/ui/toast"; // ToastAction component
import type { Address } from "@prisma/client";
import { Loader2 } from "lucide-react"; // Loader icon
import { useToast } from "@/Hooks/use-toast";

async function createAddressApi(
  data: Omit<
    Address,
    "id" | "userId" | "createdAt" | "updatedAt" | "isDefault"
  > & { isDefault?: boolean }
): Promise<Address> {
  const res = await fetch("/api/me/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to add address.");
  }
  return res.json();
}

async function updateAddressApi(
  id: string,
  data: Partial<Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Address> {
  const res = await fetch(`/api/me/address/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update address.");
  }
  return res.json();
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Address | null; // Optional initial data for editing
  onSuccess: () => void; // Callback after successful operation
}

export function AddressFormModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: Props) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    latitude: null as number | null,
    longitude: null as number | null,
    geohash: null as string | null,
  });

  // Use useEffect to reset form when modal opens for 'add' or initialData changes for 'edit'
  useEffect(() => {
    if (open) {
      // Only reset/set if modal is actually open
      setForm({
        street: initialData?.street || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        country: initialData?.country || "",
        postalCode: initialData?.postalCode || "",
        latitude: initialData?.latitude || null,
        longitude: initialData?.longitude || null,
        geohash: initialData?.geohash || null,
      });
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Mutation for creating an address
  const createAddressMutation = useMutation({
    mutationFn: createAddressApi,
    onSuccess: () => {
      toast({
        title: "Address Added!",
        description: "Your new address has been successfully saved.",
      });
      onOpenChange(false); // Close modal
      onSuccess(); // Call parent success handler to refetch addresses
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Address",
        description: error.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  // Mutation for updating an address
  const updateAddressMutation = useMutation({
    mutationFn: (data: { id: string; formData: Partial<typeof form> }) =>
      updateAddressApi(data.id, data.formData),
    onSuccess: () => {
      toast({
        title: "Address Updated!",
        description: "Your address has been successfully updated.",
      });
      onOpenChange(false); // Close modal
      onSuccess(); // Call parent success handler to refetch addresses
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Address",
        description: error.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault(); // Prevent default form submission

      // Basic client-side validation
      if (
        !form.street ||
        !form.city ||
        !form.state ||
        !form.country ||
        !form.postalCode
      ) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required address fields.",
          variant: "destructive",
        });
        return;
      }

      if (initialData) {
        updateAddressMutation.mutate({ id: initialData.id, formData: form });
      } else {
        // For new addresses, you might want a checkbox in the modal to set as default
        // For now, it will be added as non-default, or your backend API might handle this.
        createAddressMutation.mutate(form);
      }
    },
    [
      form,
      initialData,
      createAddressMutation,
      updateAddressMutation,
      onOpenChange,
      onSuccess,
      toast,
    ]
  );

  const isPending =
    createAddressMutation.isPending || updateAddressMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
            {initialData ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-center mt-1">
            {initialData
              ? "Update your delivery address details."
              : "Add a new address for your deliveries."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label
              htmlFor="street"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Street Address
            </Label>
            <Input
              id="street"
              name="street"
              placeholder="123 Main St"
              value={form.street}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              disabled={isPending}
            />
          </div>
          <div>
            <Label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              City
            </Label>
            <Input
              id="city"
              name="city"
              placeholder="New York"
              value={form.city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              disabled={isPending}
            />
          </div>
          <div>
            <Label
              htmlFor="state"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              State / Province
            </Label>
            <Input
              id="state"
              name="state"
              placeholder="NY"
              value={form.state}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              disabled={isPending}
            />
          </div>
          <div>
            <Label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Country
            </Label>
            <Input
              id="country"
              name="country"
              placeholder="USA"
              value={form.country}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              disabled={isPending}
            />
          </div>
          <div>
            <Label
              htmlFor="postalCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Postal Code
            </Label>
            <Input
              id="postalCode"
              name="postalCode"
              placeholder="10001"
              value={form.postalCode}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              disabled={isPending}
            />
          </div>
          {/* <div>
            <Label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone (Optional)
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="e.g., +1234567890"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              disabled={isPending}
            />
          </div> */}
          <Button
            type="submit"
            className="w-full py-3 text-lg font-bold bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Saving...
              </>
            ) : initialData ? (
              "Update Address"
            ) : (
              "Add Address"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
