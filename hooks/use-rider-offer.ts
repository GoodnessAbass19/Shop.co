import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export async function getNearbyOffers(
  lat: number,
  lng: number
): Promise<{ offers: any[] }> {
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Invalid coordinates");
  }

  const url = `/api/offers/nearby?lat=${encodeURIComponent(
    lat
  )}&lng=${encodeURIComponent(lng)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch nearby offers (${res.status}) ${errText}`.trim()
      );
    }

    const json = await res.json();
    // Normalize response to expected shape
    return { offers: Array.isArray(json.offers) ? json.offers : json || [] };
  } catch (err) {
    console.error("getNearbyOffers error:", err);
    return { offers: [] };
  }
}

export function useRiderOffers(riderId: string, lat: number, lng: number) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial offers
  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      try {
        const res = await getNearbyOffers(lat, lng);
        setOffers(res.offers || []);
      } catch (e) {
        console.error("Failed to fetch offers:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, [lat, lng]);

  // Subscribe to Pusher for real-time updates
  useEffect(() => {
    if (!riderId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth", // optional if using private/presence channels
    });

    const channel = pusher.subscribe(`private-rider-${riderId}`);

    // When a new offer is broadcast from backend
    channel.bind("delivery.new_offer", (data: any) => {
      setOffers((prev) => {
        // Avoid duplicates
        if (prev.some((o) => o.id === data.deliveryItemId)) return prev;
        return [...prev, data];
      });
    });

    // Optional: Handle order cancellation or reassignment cleanup
    channel.bind("delivery.cancelled", (data: any) => {
      setOffers((prev) => prev.filter((o) => o.id !== data.deliveryItemId));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-rider-${riderId}`);
    };
  }, [riderId]);

  return { offers, loading, setOffers };
}
