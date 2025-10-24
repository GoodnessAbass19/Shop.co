// components/rider/offer-card.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function OfferCard({
  offer,
  onAccept,
  onDecline,
}: {
  offer: any | null;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}) {
  if (!offer) return null;

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", stiffness: 120 }}
      className="rounded-2xl shadow-xl bg-white p-4 border border-gray-100 max-w-md mx-auto"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">New Offer • ₦{offer.fee}</h3>
          <p className="text-sm text-muted-foreground">
            {offer.title || "Delivery"}
          </p>
        </div>
        <div className="text-right text-sm">
          <div>{offer.distance}</div>
          <div className="text-xs text-muted-foreground">{offer.eta}</div>
        </div>
      </div>

      <div className="mt-3 text-sm space-y-1">
        <div>
          <strong>Pickup:</strong> {offer.pickupAddress}
        </div>
        <div>
          <strong>Drop-off:</strong> {offer.dropoffAddress}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => onDecline?.(offer.id)}
        >
          Decline
        </Button>
        <Button className="flex-1" onClick={() => onAccept?.(offer.id)}>
          Accept
        </Button>
      </div>
    </motion.div>
  );
}
