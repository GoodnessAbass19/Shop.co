"use client";
import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export function useOffers() {
  const [incomingOffer, setIncomingOffer] = useState<any | null>(null);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
    });
    const channel = pusher.subscribe("private-riders");

    channel.bind("delivery.offer.created", (offer: any) => {
      setIncomingOffer(offer);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  return { incomingOffer, clearOffer: () => setIncomingOffer(null) };
}
