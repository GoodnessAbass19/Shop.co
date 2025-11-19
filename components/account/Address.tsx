// components/user/AddressManager.tsx
"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Import Tanstack Query hooks
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import { useToast } from "@/Hooks/use-toast"; // Your custom useToast hook
import { ToastAction } from "@/components/ui/toast"; // ToastAction component
import { Address } from "@prisma/client"; // Prisma Address type
import { AddressFormModal } from "./AddressFormModal"; // Your Address Form Modal component
import {
  Loader2,
  Plus,
  Home,
  MapPin,
  Phone,
  Trash2,
  Pencil,
} from "lucide-react"; // Icons

// API functions (assuming these interact with your backend)
// You might need to adjust their return types or how they are structured
// to fit with how you call them (e.g., from /api/addresses, /api/addresses/[id]/default, /api/addresses/[id])
async function getAddresses(): Promise<Address[]> {
  const res = await fetch("/api/me/address"); // Assuming a GET endpoint for addresses
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch addresses.");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : []; // Assuming API returns { addresses: [] }
}

async function deleteAddressApi(id: string): Promise<void> {
  const res = await fetch(`/api/me/address/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const errorData = await res.json();
    // Check if the error code from the API is P2003 (Foreign Key Constraint Violation)
    if (errorData.code === "P2003") {
      throw new Error(
        "This address cannot be deleted because it is linked to past orders."
      );
    }
    // For any other error, throw the generic message
    throw new Error(errorData.error || "Failed to delete address.");
  }
}

async function setDefaultAddressApi(id: string): Promise<void> {
  const res = await fetch(`/api/me/address/${id}/default`, { method: "PATCH" }); // Assuming a PATCH endpoint
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to set default address.");
  }
}

export function AddressManager() {
  const queryClient = useQueryClient(); // Access the query client
  const { toast } = useToast(); // Initialize toast hook

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [openModal, setOpenModal] = useState(false);

  // useQuery to fetch addresses
  const { data: addresses, isLoading } = useQuery<Address[], Error>({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    staleTime: 60 * 1000, // Data considered fresh for 1 minute
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // useMutation for deleting an address
  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddressApi, // Use the API function
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] }); // Invalidate addresses query to refetch
      toast({
        title: "Address Deleted",
        description: "The address has been successfully removed.",
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Deletion Failed",
        description: mutationError.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  // useMutation for setting default address
  const setDefaultAddressMutation = useMutation({
    mutationFn: setDefaultAddressApi, // Use the API function
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] }); // Invalidate addresses query to refetch
      toast({
        title: "Default Address Updated",
        description: "Your default address has been changed.",
      });
    },
    onError: (mutationError: Error) => {
      toast({
        title: "Update Failed",
        description: mutationError.message,
        variant: "destructive",
        action: <ToastAction altText="Try again">Dismiss</ToastAction>,
      });
    },
  });

  // Combined loading state for buttons
  const isActionPending =
    deleteAddressMutation.isPending || setDefaultAddressMutation.isPending;

  // Handle delete action
  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this address?")) {
        deleteAddressMutation.mutate(id);
      }
    },
    [deleteAddressMutation]
  );

  // Handle set default action
  const handleSetDefault = useCallback(
    (id: string) => {
      setDefaultAddressMutation.mutate(id);
    },
    [setDefaultAddressMutation]
  );

  // Handle modal close or success
  const handleModalCloseOrSuccess = useCallback(() => {
    setOpenModal(false);
    setEditingAddress(null); // Clear editing state
    queryClient.invalidateQueries({ queryKey: ["addresses"] }); // Force refetch after add/edit
    toast({
      title: "Address Saved",
      description: "Your address has been successfully added/updated.",
    });
  }, [queryClient, toast]);

  return (
    <div className="w-full mx-auto p-8  min-h-[500px]">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900 capitalize">
          Your Delivery Addresses
        </h2>
        <Button
          onClick={() => {
            setEditingAddress(null); // Ensure no address is in editing mode
            setOpenModal(true);
          }}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-md flex items-center shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="mr-2 h-5 w-5" /> Add New Address
        </Button>
      </div>

      {isLoading ? (
        <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </section>
      ) : addresses?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          <MapPin className="w-16 h-16 mb-4 text-gray-400" />
          <p className="text-xl font-medium mb-2">No addresses found.</p>
          <p className="text-lg text-center">
            Add your first delivery address to get started!
          </p>
          <Button
            onClick={() => {
              setEditingAddress(null);
              setOpenModal(true);
            }}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="mr-2 h-5 w-5" /> Add Address
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {addresses?.map((addr) => (
            <li
              key={addr.id}
              className="relative bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-lg font-semibold text-gray-800 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                  {addr.street}
                </p>
                {addr.isDefault && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200 flex items-center">
                    <Home className="h-3 w-3 mr-1" /> Default
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-1">
                {addr.city}, {addr.state}, {addr.country}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                ZIP: {addr.postalCode}
              </p>
              {/* {addr?.phone && ( // Display phone if it exists
                  <p className="text-sm text-gray-600 flex items-center">
                    <Phone className="h-4 w-4 mr-1.5 text-gray-500" /> {addr.phone}
                  </p>
              )} */}

              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                {!addr.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={isActionPending}
                    className="flex-grow sm:flex-grow-0 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingAddress(addr);
                    setOpenModal(true);
                  }}
                  disabled={isActionPending}
                  className="flex-grow sm:flex-grow-0 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(addr.id)}
                  disabled={isActionPending}
                  className="flex-grow sm:flex-grow-0"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
              {isActionPending && ( // Show loading indicator over address card during action
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                  <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Address Form Modal */}
      <AddressFormModal
        open={openModal}
        onOpenChange={setOpenModal}
        initialData={editingAddress}
        onSuccess={handleModalCloseOrSuccess} // Use the consolidated success handler
      />
    </div>
  );
}
