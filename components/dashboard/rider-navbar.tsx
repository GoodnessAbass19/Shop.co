"use client";

import { Button } from "../ui/button";
import { Bell, Moon, Sun, Truck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { Rider, User } from "@prisma/client";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

// Function to fetch the unread notifications count for the seller
const fetchUnreadNotificationsCount = async (): Promise<{ count: number }> => {
  // Assuming your /api/notifications endpoint can filter by role and read status
  const res = await axios.get("/api/notifications?role=RIDER&read=false");
  return { count: res.data.totalNotifications || 0 }; // Assuming totalNotifications is the count of unread items
};

const RiderNavbar = ({
  rider,
  onStatusChange,
}: {
  rider: Rider & { user: User };
  onStatusChange?: (isActive: boolean) => void;
}) => {
  // Use useQuery to fetch the unread count
  const { data } = useQuery<{ count: number }, Error>({
    queryKey: ["unreadRiderNotificationsCount"],
    queryFn: fetchUnreadNotificationsCount,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds to keep count updated
    staleTime: 10 * 1000, // Data considered stale after 10 seconds
  });

  const unreadCount = data?.count || 0;
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  if (pathname !== "/logistics/rider/dashboard") {
    return null;
  }

  return (
    <header className="space-y-2 max-w-screen-xl mx-auto">
      <nav className="w-full h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Truck className="w-8 h-8" />
          <HoverPrefetchLink
            href="/logistics/rider/dashboard"
            className="text-xl font-extrabold uppercase"
          >
            shop.co
          </HoverPrefetchLink>

          <div className="flex items-center gap-5 ml-4">
            <HoverPrefetchLink
              href="/logistics/rider/dashboard"
              className={cn(
                "capitalize text-base font-semibold",
                pathname === "/logistics/rider/dashboard"
                  ? "text-green-500"
                  : ""
              )}
            >
              Dashboard
            </HoverPrefetchLink>

            <HoverPrefetchLink
              href="/logistics/rider/dashboard/active-order"
              className={cn(
                "capitalize text-base font-semibold"
                // pathname === "/logistics/rider/dashboard/active-order"
                //   ? "text-green-500"
                //   : ""
              )}
            >
              Active orders
            </HoverPrefetchLink>

            <HoverPrefetchLink
              href="/logistics/rider/dashboard/earnings"
              className={cn(
                "capitalize text-base font-semibold"
                // pathname === "/logistics/rider/dashboard/earnings"
                //   ? "text-green-500"
                //   : ""
              )}
            >
              Earning history
            </HoverPrefetchLink>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="">
            {theme === "dark" ? (
              <Moon
                className="w-6 h-6 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
              />
            ) : (
              <Sun
                className="w-6 h-6 text-yellow-500"
                fill="#eab308"
                stroke="currentColor"
              />
            )}
          </button>

          <HoverPrefetchLink
            href="/logistics/rider/dashboard/notifications"
            className={cn(
              "relative p-2 rounded-md transition-colors duration-200 bg-gray-200/80"
            )}
          >
            <Bell className="h-5 w-5 mr-1" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-2 h-2 flex items-center justify-center animate-bounce">
                {/* {unreadCount} */}
              </span>
            )}
          </HoverPrefetchLink>

          <HoverPrefetchLink
            href={"/rider/dashboard/profile"}
            className="flex gap-1 items-center"
          >
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage
                src={rider?.profileImage || ""}
                alt={rider?.firstName}
                className="object-cover object-center aspect-square"
              />
              <AvatarFallback className="rounded-full uppercase">
                {getInitials(`${rider?.firstName} ${rider?.lastName}`)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h3 className="text-sm capitalize font-semibold">
                {rider?.firstName} {rider?.lastName}
              </h3>
              <span className="text-sm font-medium text-gray-400">
                Rider ID: #{rider?.id.substring(0, 5).toUpperCase()}
              </span>
            </div>
          </HoverPrefetchLink>
        </div>
      </nav>

      <hr className="w-full bg-gray-400" />
    </header>
  );
};

export default RiderNavbar;
