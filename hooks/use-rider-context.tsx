"use client";

import { pusherClient } from "@/lib/pusher-client";
import { Rider, User } from "@prisma/client";
import { createContext, useContext, useEffect, useState } from "react";

export type RiderState =
  | "IDLE" // no active delivery
  | "OFFER_VIEW" // popup visible
  | "ON_ROUTE_TO_PICKUP"
  | "WAITING_PICKUP_CONFIRM"
  | "ON_ROUTE_TO_DROPOFF"
  | "WAITING_DELIVERY_CONFIRM"
  | "COMPLETED";

interface ActiveDelivery {
  id: string;
  pickup: [number, number];
  dropoff: [number, number];
  status: string;
}

// Define the context value type
interface RiderContextType {
  rider?: Rider & {
    user: User;
  };
  state: RiderState;
  setState: (s: RiderState) => void;
  activeDelivery: ActiveDelivery | null;
  setActiveDelivery: (d: ActiveDelivery | null) => void;
  riderLocation: [number, number] | null;
}

// Create the context
const RiderContext = createContext<RiderContextType | undefined>({
  state: "IDLE",
  setState: () => {},
  activeDelivery: null,
  setActiveDelivery: () => {},
  riderLocation: null,
});

// Create a provider component
export function RiderProvider({
  children,
  rider,
}: {
  children: React.ReactNode;
  rider: Rider & { user: User };
}) {
  const [state, setState] = useState<RiderState>("IDLE");
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(
    null
  );
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null
  );

  // Watch location and update periodically
  useEffect(() => {
    let watcher: number;
    if (navigator.geolocation) {
      watcher = navigator.geolocation.watchPosition(
        async (pos) => {
          const coords: [number, number] = [
            pos.coords.longitude,
            pos.coords.latitude,
          ];
          setRiderLocation(coords);

          // optionally sync with backend every 15s
          await fetch("/api/rider/location", {
            method: "POST",
            body: JSON.stringify({ latitude: coords[1], longitude: coords[0] }),
          });
        },
        (err) => console.error("Location watch error:", err),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  // Listen for new offers
  useEffect(() => {
    const riderId = localStorage.getItem("riderId");
    if (!riderId) return;

    const channel = pusherClient.subscribe(`private-rider-${riderId}`);

    channel.bind("offer.new", (offer: any) => {
      if (state === "IDLE") {
        setState("OFFER_VIEW");
        setActiveDelivery({
          id: offer.id,
          pickup: offer.pickupLocation,
          dropoff: offer.dropoffLocation,
          status: "PENDING",
        });
      }
    });

    return () => {
      pusherClient.unsubscribe(`private-rider-${riderId}`);
    };
  }, [state]);

  return (
    <RiderContext.Provider
      value={{
        rider,
        state,
        setState,
        activeDelivery,
        setActiveDelivery,
        riderLocation,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
}
// Create a custom hook to use the RiderContext
export const useRiderContext = () => {
  const context = useContext(RiderContext);
  if (context === undefined) {
    throw new Error("useRiderContext must be used within a RiderProvider");
  }
  return context;
};
