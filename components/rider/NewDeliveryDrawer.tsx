"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { MapPin, StoreIcon, Loader2 } from "lucide-react";

type Offer = {
  id: string;
  orderItemId?: string;
  storeName: string;
  pickupAddress: string;
  dropoffAddress: string;
  fee: number;
  sellerLat: number;
  sellerLng: number;
  buyerLat: number;
  buyerLng: number;
  expiresAt: string;
};

interface Props {
  offer: Offer | null;
  open: boolean;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  onAccepted?: (offer: Offer) => void;
}

export default function NewDeliveryDrawer({
  offer,
  open,
  onClose,
  onAccept,
  onDecline,
  onAccepted,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingDecline, setLoadingDecline] = useState(false);

  // debug - remove later
  useEffect(() => {
    console.log("[Drawer] props:", { open, hasOffer: !!offer });
  }, [open, offer]);

  // Countdown when we have an offer
  useEffect(() => {
    if (!offer) {
      setSecondsLeft(0);
      return;
    }

    const update = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(offer.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
      return diff;
    };

    // initialize immediately
    const first = update();
    if (first === 0) return;

    const interval = setInterval(() => {
      const diff = update();
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [offer]);

  // Auto close on expiry
  useEffect(() => {
    if (offer && secondsLeft === 0) {
      onClose();
    }
  }, [secondsLeft, offer, onClose]);

  // Map src uses seller coords if available
  const mapSrc = offer
    ? `https://www.google.com/maps?q=${offer.sellerLat},${offer.sellerLng}&z=15&output=embed`
    : `about:blank`;

  // Render the Drawer controlled by `open` (always mounted)
  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        // onOpenChange passes the new open state
        // if it closed, call onClose() so parent can clear offer & state
        if (!isOpen) onClose();
      }}
    >
      <DrawerContent className="p-0 overflow-hidden">
        <DrawerHeader className="space-y-1">
          <DrawerTitle className="text-xl font-bold">
            New Delivery Request
          </DrawerTitle>
          <DrawerDescription>Nearby store needs a rider</DrawerDescription>
        </DrawerHeader>

        {/* LIVE MAP / placeholder */}
        <div className="w-full h-[200px] rounded-md overflow-hidden border">
          {offer ? (
            <iframe
              src={mapSrc}
              className="w-full h-full border-0"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
              Loading map...
            </div>
          )}
        </div>

        <div className="px-4 py-4 flex flex-col gap-4 text-sm">
          {/* PICKUP */}
          <div className="flex items-start gap-3">
            <StoreIcon className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold">PICKUP</p>
              <p className="text-sm">{offer?.storeName ?? "Loading..."}</p>
              <p className="text-xs text-gray-600">
                {offer?.pickupAddress ?? ""}
              </p>
            </div>
          </div>

          {/* DELIVERY */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold">DELIVERY</p>
              <p className="text-sm">{offer?.dropoffAddress ?? ""}</p>
            </div>
          </div>

          {/* Earnings */}
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
            <div>
              <p className="text-gray-700 text-sm">Earnings</p>
              <p className="text-xl font-bold">
                {offer ? (
                  `₦${offer.fee.toFixed(2)}`
                ) : (
                  <span className="inline-block w-16 h-4 bg-gray-200 animate-pulse" />
                )}
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="text-center font-semibold text-sm">
            {offer ? (
              secondsLeft > 10 ? (
                <span className="text-green-600">{secondsLeft}s to accept</span>
              ) : (
                <span className="text-red-600 animate-pulse">
                  {secondsLeft}s to accept
                </span>
              )
            ) : (
              <span className="text-gray-500">Waiting for offer...</span>
            )}
          </div>
        </div>

        <DrawerFooter className="flex flex-col gap-2">
          <Button
            disabled={loadingAccept || !offer}
            onClick={async () => {
              if (!offer) return;
              setLoadingAccept(true);
              try {
                const id = offer.orderItemId || offer.id;
                await onAccept(id);
                onAccepted?.(offer);
                onClose();
              } catch (err) {
                console.error("Accept error:", err);
                setLoadingAccept(false);
              }
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            {loadingAccept ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Accept Delivery"
            )}
          </Button>

          <Button
            variant="outline"
            disabled={loadingDecline || !offer}
            onClick={async () => {
              if (!offer) return;
              setLoadingDecline(true);
              try {
                await onDecline(offer.id);
                onClose();
              } catch (err) {
                console.error("Decline error:", err);
                setLoadingDecline(false);
              }
            }}
          >
            {loadingDecline ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Decline"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
