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
import { ArrowRight, MapPin, StoreIcon, Loader2 } from "lucide-react";
import Image from "next/image";

type Offer = {
  id: string;
  storeName: string;
  storeAddress: string;
  customerAddress: string;
  payout: number;
  distanceKm: number;
  offerExpiresAt: string;
};

interface Props {
  offer: Offer | null;
  open: boolean;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

export default function NewDeliveryDrawer({
  offer,
  open,
  onClose,
  onAccept,
  onDecline,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingDecline, setLoadingDecline] = useState(false);

  // countdown timer
  useEffect(() => {
    if (!offer) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor(
          (new Date(offer.offerExpiresAt).getTime() - Date.now()) / 1000
        )
      );
      setSecondsLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [offer]);

  if (!offer) return null;

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="p-0">
        <DrawerHeader className="space-y-1">
          <DrawerTitle className="text-xl font-bold">
            New Delivery Request
          </DrawerTitle>
          <DrawerDescription>
            A nearby store has a delivery available.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden w-full aspect-video bg-gray-200 relative">
            <Image
              src="https://placeholder.pics/svg/500"
              alt="map preview"
              fill
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-start gap-3">
              <StoreIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-gray-700 font-semibold">PICKUP</p>
                <p className="text-gray-900 font-medium">{offer.storeName}</p>
                <p className="text-gray-600 text-xs">{offer.storeAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-gray-700 font-semibold">DELIVERY</p>
                <p className="text-gray-900">{offer.customerAddress}</p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
              <div>
                <p className="text-gray-700 text-sm">Earnings</p>
                <p className="text-xl font-bold">${offer.payout.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-700 text-sm">Distance</p>
                <p className="text-xl font-bold">{offer.distanceKm} km</p>
              </div>
            </div>

            <div className="text-center text-red-600 font-semibold text-sm">
              Offer expires in {secondsLeft}s
            </div>
          </div>
        </div>

        <DrawerFooter className="flex flex-col gap-2">
          <Button
            disabled={loadingAccept}
            onClick={async () => {
              setLoadingAccept(true);
              await onAccept(offer.id);
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
            disabled={loadingDecline}
            onClick={async () => {
              setLoadingDecline(true);
              await onDecline(offer.id);
            }}
            className="border-gray-300"
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
