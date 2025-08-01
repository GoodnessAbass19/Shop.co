// components/seller/NotificationBell.tsx
"use client";

import { Bell, Loader2 } from "lucide-react"; // Added Loader2 for loading state
import Link from "next/link";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import axios from "axios"; // Keep axios for the fetch function
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";

// Function to fetch the unread notifications count for the seller
const fetchUnreadNotificationsCount = async (): Promise<{ count: number }> => {
  // Assuming your /api/notifications endpoint can filter by role and read status
  const res = await axios.get("/api/notifications?role=SELLER&read=false");
  // Adjust based on your API response structure.
  // If your /api/notifications endpoint returns an array, you'd count unread items:
  // return { count: res.data.notifications.filter((n: any) => !n.read).length };
  // If you have a dedicated /api/notifications/unread-count endpoint, use that:
  // const res = await axios.get("/api/notifications/unread-count?role=SELLER");
  // return res.data; // Assuming it returns { count: number }
  return { count: res.data.totalNotifications || 0 }; // Assuming totalNotifications is the count of unread items
};

export default function NotificationBell() {
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
  const { open } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <HoverPrefetchLink
          href="/your/store/dashboard/notifications"
          className={cn(
            "relative w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
            // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
            pathname === "/your/store/dashboard/notifications"
              ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
              : ""
          )}
        >
          <Bell className="h-5 w-5 mr-1" /> Notification
          {unreadCount > 0 && (
            <div>
              {!open ? (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-2 h-2 flex items-center justify-center animate-bounce">
                  {/* {unreadCount} */}
                </span>
              ) : (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          )}
        </HoverPrefetchLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
