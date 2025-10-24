// components/rider/bottom-drawer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import AvailableOffers from "./available-offers"; // you'll implement the list
// import ActiveDeliveries from "./active-deliveries"; // you'll implement this list
import { Button } from "@/components/ui/button";

export function BottomDrawer({
  offers,
  active,
  onAccept,
  onDecline,
  onSelectOffer,
}: {
  offers: any[];
  active: any[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onSelectOffer?: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      className="absolute left-0 right-0 bottom-0"
      style={{ pointerEvents: "auto" }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="mx-4">
          <div className="w-full h-1 bg-gray-200 rounded-full mb-2" />
        </div>

        <AnimatePresence initial={false}>
          <motion.div
            key={open ? "open" : "closed"}
            initial={{ y: 300 }}
            animate={{ y: open ? 0 : 220 }}
            exit={{ y: 300 }}
            transition={{ type: "spring", stiffness: 140 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 120) setOpen(false);
              if (info.offset.y < -120) setOpen(true);
            }}
            className="bg-white dark:bg-neutral-900 rounded-t-3xl p-4 shadow-2xl border-t"
            style={{ minHeight: open ? "55vh" : "18vh" }}
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-semibold">Offers</h3>
                <p className="text-sm text-muted-foreground">
                  New offers and reoffers around you
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpen((v) => !v)}
                >
                  {open ? "Minimize" : "Expand"}
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Available Offers</h4>
                {offers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No offers right now
                  </div>
                ) : (
                  <div className="space-y-2">
                    {offers.map((o: any) => (
                      <div
                        key={o.id}
                        className="p-3 border rounded-lg flex justify-between items-start"
                      >
                        <div
                          onClick={() => onSelectOffer?.(o.id)}
                          className="flex-1"
                        >
                          <div className="font-medium">
                            {o.title || `Order ${o.id.slice(-6)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Pickup: {o.pickupAddress}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Fee: ₦{o.fee}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDecline(o.id)}
                          >
                            Decline
                          </Button>
                          <Button size="sm" onClick={() => onAccept(o.id)}>
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Active Deliveries</h4>
                {active.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No active deliveries
                  </div>
                ) : (
                  <div className="space-y-2">
                    {active.map((a: any) => (
                      <div key={a.id} className="p-3 border rounded-lg">
                        <div className="font-medium">
                          {a.orderItem.productVariant.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Status: {a.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default BottomDrawer;
