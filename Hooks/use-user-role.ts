import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

interface UserStatus {
  isRider?: boolean;
  isSeller?: boolean;
}

// Function to fetch the user's current status
const fetchUserStatus = async (): Promise<UserStatus> => {
  const res = await fetch("/api/me"); // Assuming you have a route to get current user data
  if (!res.ok) {
    throw new Error("Failed to fetch user status");
  }
  const data = await res.json();
  return { isRider: data.user?.isRider, isSeller: data.user?.isSeller };
};

// Function to update the user's status
const updateUserStatus = async (status: UserStatus): Promise<UserStatus> => {
  const res = await fetch("/api/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(status),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update status");
  }
  const data = await res.json();
  return { isRider: data.isRider, isSeller: data.isSeller };
};

export function useUserRole() {
  const queryClient = useQueryClient();

  // Use useQuery to get the initial status
  const { data, isLoading, isError } = useQuery<UserStatus, Error>({
    queryKey: ["userStatus"],
    queryFn: fetchUserStatus,
    staleTime: 10 * 60 * 1000, // The role won't change unless the user explicitly switches
  });

  // Use useMutation to handle the API call to update the role
  const {
    mutateAsync: switchRole,
    isPending: isSwitching,
    isError: switchError,
  } = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: (updatedStatus) => {
      // Manually update the cache to reflect the new role
      queryClient.setQueryData(["userStatus"], updatedStatus);
      // Invalidate the 'current-user' query to ensure other parts of the app get the latest data
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });

  const switchToRider = async () => {
    if (data?.isRider) return; // Already a rider, do nothing
    await switchRole({ isRider: true, isSeller: false });
  };

  const switchToSeller = async () => {
    if (data?.isSeller) return; // Already a seller, do nothing
    await switchRole({ isSeller: true, isRider: false });
  };

  const clearRole = async () => {
    await switchRole({ isSeller: false, isRider: false });
  };

  return {
    isRider: data?.isRider,
    isSeller: data?.isSeller,
    isLoading,
    isError,
    isSwitching,
    switchError,
    switchToRider,
    switchToSeller,
    clearRole,
  };
}
