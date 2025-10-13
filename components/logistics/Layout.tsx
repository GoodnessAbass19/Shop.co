"use client";

import { RiderProvider } from "@/Hooks/use-rider-context";
import { useUserRole } from "@/Hooks/use-user-role";
import { Rider, User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

// Fetch rider data function
const fetchRiderData = async (): Promise<{ rider: Rider & { user: User } }> => {
  const res = await fetch("/api/rider");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch seller store data.");
  }
  return res.json();
};

const RiderDashboardLayout = ({
  children,
  riderToken,
}: {
  children: React.ReactNode;
  riderToken?: string | undefined;
}) => {
  const { isRider, isLoading: isRoleLoading } = useUserRole();

  // fetch rider data
  const { data, isLoading, isError, error } = useQuery<
    { rider: Rider & { user: User } },
    Error
  >({
    queryKey: ["riderData"],
    queryFn: fetchRiderData,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 10 minutes
    refetchOnWindowFocus: false,
    // enabled: isRider === true && !!riderToken, // Only run the query if riderToken is available
    retry: 1, // Retry once if it fails
  });

  const riderData = data?.rider;

  if (isRoleLoading || isLoading) {
    return <div>Loading...</div>;
  }

  return <RiderProvider rider={riderData!}>{children}</RiderProvider>;
};

export default RiderDashboardLayout;
