// components/seller/UserNotificationBell.tsx
"use client";

import { Bell, Loader2 } from "lucide-react"; // Added Loader2 for loading state
import Link from "next/link";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import axios from "axios"; // Keep axios for the fetch function
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

// Function to fetch the unread notifications count for the seller
const fetchUnreadNotificationsCount = async (): Promise<{ count: number }> => {
  // Assuming your /api/notifications endpoint can filter by role and read status
  const res = await axios.get("/api/notifications?role=BUYER&read=false");
  // Adjust based on your API response structure.
  // If your /api/notifications endpoint returns an array, you'd count unread items:
  // return { count: res.data.notifications.filter((n: any) => !n.read).length };
  // If you have a dedicated /api/notifications/unread-count endpoint, use that:
  // const res = await axios.get("/api/notifications/unread-count?role=SELLER");
  // return res.data; // Assuming it returns { count: number }
  return { count: res.data.totalNotifications || 0 }; // Assuming totalNotifications is the count of unread items
};

export default function UserNotificationBell() {
  // Use useQuery to fetch the unread count
  const {
    data,
    isLoading,
    isError,
    // error // Error not explicitly handled in UI for bell, but available
  } = useQuery<{ count: number }, Error>({
    queryKey: ["unreadSellerNotificationsCount"],
    queryFn: fetchUnreadNotificationsCount,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds to keep count updated
    staleTime: 10 * 1000, // Data considered stale after 10 seconds
  });

  const unreadCount = data?.count || 0;

  // You might want a subtle loading indicator or just show 0 during loading
  // if (isLoading) {
  //   return (
  //     <div className="relative flex items-center justify-center w-6 h-6">
  //       <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
  //     </div>
  //   );
  // }

  // if (isError) {
  //   // Silently fail or show a subtle error state for the bell
  //   return (
  //     <Link href="/dashboard/seller/notifications" className="relative">
  //       <Bell className="w-6 h-6 text-red-500" />{" "}
  //       {/* Indicate error with color */}
  //     </Link>
  //   );
  // }
  const pathname = usePathname();

  return (
    <HoverPrefetchLink
      href="/me/inbox"
      className={cn(
        "flex justify-between w-full items-center gap-2 capitalize"
        // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
      )}
    >
      <Bell className="w-5 h-5 text-black" /> inbox
      {unreadCount > 0 && (
        <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </HoverPrefetchLink>
  );
}
