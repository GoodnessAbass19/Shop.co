import { useEffect } from "react";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";

type OrderRealtimeOptions = {
  /** The orderId to listen for */
  orderId: string;
  /** Channel type: buyer, seller, or rider */
  type: "buyer" | "seller" | "rider";
  /** Entity id (buyerId, storeId, or riderId) */
  entityId: string;
};

export function useOrderRealtime({
  orderId,
  type,
  entityId,
}: OrderRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!entityId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher",
    });

    const channelName = `private-${type}-${entityId}`;
    const channel = pusher.subscribe(channelName);

    // 🔹 Handle order-wide updates
    channel.bind(
      "order-updated",
      (data: { orderId: string; status: string }) => {
        if (data.orderId === orderId) {
          queryClient.invalidateQueries({
            queryKey: [`${type}OrderDetails`, orderId],
          });
        }
      }
    );

    // 🔹 Handle item-level updates
    channel.bind(
      "order-item-updated",
      (data: { orderId: string; itemId: string; deliveryStatus: string }) => {
        if (data.orderId === orderId) {
          queryClient.invalidateQueries({
            queryKey: [`${type}OrderDetails`, orderId],
          });
        }
      }
    );

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [orderId, type, entityId, queryClient]);
}
