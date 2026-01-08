"use client";

import { RiderProvider } from "@/hooks/use-rider-context";
import { useUserRole } from "@/hooks/use-user-role";
import { Rider, User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import RiderNavbar from "../dashboard/rider-navbar";

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
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  return (
    <RiderProvider rider={riderData!}>
      <RiderNavbar rider={data?.rider!} />
      {children}
    </RiderProvider>
  );
};

export default RiderDashboardLayout;
