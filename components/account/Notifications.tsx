// components/seller/SellerNotifications.tsx
"use client";

import axios from "axios";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react"; // Assuming you have a loader icon

// Ensure this type matches your Prisma Notification model structure
type Notification = {
  id: string;
  title: string;
  message: string;
  type: string; // Corresponds to NotificationType enum
  read: boolean;
  createdAt: string;
  link?: string; // Add link if your schema has it
};

// Function to fetch seller notifications
const fetchSellerNotifications = async (): Promise<Notification[]> => {
  // Assuming your backend /api/notifications endpoint handles filtering by 'role'
  const res = await axios.get("/api/notifications?role=BUYER");
  return res.data.notifications; // Adjust based on your API response structure
};

// Function to mark a notification as read
const markNotificationAsRead = async (id: string) => {
  // Assuming your backend /api/notifications/[id]/read accepts PATCH
  const res = await axios.patch(`/api/notifications/${id}/read`);
  return res.data; // The updated notification
};

export default function BuyerNotifications() {
  const queryClient = useQueryClient();

  // Use useQuery to fetch notifications
  const {
    data: notifications,
    isLoading,
    isError,
    error,
  } = useQuery<Notification[], Error>({
    queryKey: ["sellerNotifications"],
    queryFn: fetchSellerNotifications,
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    // You might want to refetch on mount or focus, depending on how "real-time" you need it
    // refetchOnWindowFocus: true,
  });

  // Use useMutation to handle marking a notification as read
  const markAsReadMutation = useMutation<
    Notification, // Expected return type of mutationFn
    Error, // Expected error type
    string, // Type of the variable passed to mutationFn (notification ID)
    { previousNotifications: Notification[] | undefined } // Context type for onMutate
  >({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["sellerNotifications"] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>([
        "sellerNotifications",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Notification[]>(["sellerNotifications"], (old) =>
        old
          ? old.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
          : []
      );

      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    onError: (err, newNotificationId, context) => {
      // If the mutation fails, use the context for a rollback
      queryClient.setQueryData(
        ["sellerNotifications"],
        context?.previousNotifications
      );
      console.error("Failed to mark notification as read:", err);
      // You could also show a toast notification here
    },
    onSettled: () => {
      // Always refetch after error or success:
      // Invalidate the query to ensure we have fresh data from the server
      queryClient.invalidateQueries({ queryKey: ["sellerNotifications"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-lg shadow p-6">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <p className="ml-2 text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-red-600 text-center">
        <p>Error loading notifications: {error?.message}</p>
        <p className="text-sm mt-2">Please try again later.</p>
      </div>
    );
  }

  const sortedNotifications = notifications?.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-screen-xl mx-auto mt-10 px-4 md:px-6 lg:px-8">
      <h2 className="text-xl font-semibold mb-4">Inbox</h2>
      {sortedNotifications && sortedNotifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <ul className="space-y-4">
          {sortedNotifications?.map((n) => (
            <li
              key={n.id}
              className={clsx(
                "p-4 border rounded-lg transition-colors duration-200",
                n.read
                  ? "bg-gray-50 border-gray-200"
                  : "bg-blue-50 border-blue-200"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {/* {n.link && (
                    <a
                      href={n.link}
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Details
                    </a>
                  )} */}
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsReadMutation.mutate(n.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap ml-4"
                    disabled={markAsReadMutation.isPending}
                  >
                    {markAsReadMutation.isPending
                      ? "Marking..."
                      : "Mark as read"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
