"use client";

import {
  Address,
  DeliveryItem,
  Order,
  OrderItem,
  Rider,
  Store,
  User,
} from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "@/Hooks/use-toast";
import {
  ArrowRight,
  Loader2,
  MapPin,
  MapPinHouse,
  Star,
  StoreIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import {
  encodeGeoHash4,
  encodeGeoHash5,
  getGeoHashNeighbors,
} from "@/lib/geohash";
import { pusherClient } from "@/lib/pusher-client";
import NewDeliveryDrawer from "./NewDeliveryDrawer";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

type RiderData = {
  rider: Rider & { user: User } & { deliveries?: DeliveryItem[] };
  earnings: { today: number; week: number; month: number; total: number };
  acceptanceRate: number;
  rating: number;
  activeDelivery: DeliveryItem & {
    orderItem: OrderItem & { store: Store } & {
      order: Order & { address: Address };
    };
  };
  completedDeliveries: number;
};

// Fetch rider data function
const fetchRiderData = async (): Promise<RiderData> => {
  const res = await fetch("/api/rider");
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch seller store data.");
  }
  return res.json();
};

const RiderDashboard = () => {
  // fetch rider data
  const { data, isLoading } = useQuery<RiderData, Error>({
    queryKey: ["riderData"],
    queryFn: fetchRiderData,
    staleTime: 10 * 60 * 1000, // Data considered fresh for 10 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Retry once if it fails
  });

  const riderData = data?.rider;
  const riderEarnings = data?.earnings!;
  const activeDelivery = data?.activeDelivery;
  const queryClient = useQueryClient();

  const { toast } = useToast();
  const [isActive, setIsActive] = useState<boolean>(!!riderData?.isActive);
  const [loading, setLoading] = useState(false);
  const [zoneHash, setZoneHash] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [drawerOffer, setDrawerOffer] = useState<any | null>(null);

  // Geozone & refs for stable subscriptions
  const subscribedChannelsRef = useRef<Set<string>>(new Set()); // currently subscribed presence channels
  const watchIdRef = useRef<number | null>(null);

  // Refs for one-time pusher connection binding
  const pusherConnectedBoundRef = useRef(false);

  // === Pusher connection binds (once) ===
  useEffect(() => {
    if (pusherConnectedBoundRef.current) return;
    pusherConnectedBoundRef.current = true;

    pusherClient.connection.bind("connected", () => {
      console.log("✅ PUSHER CONNECTED");
    });
    pusherClient.connection.bind("error", (err: any) => {
      console.error("❌ PUSHER CONNECTION ERROR", err);
    });

    return () => {
      try {
        pusherClient.connection.unbind("connected");
        pusherClient.connection.unbind("error");
      } catch {}
    };
  }, []);

  // === Subscribe to private rider channel for assigned jobs ===
  useEffect(() => {
    if (!riderData?.id) return;

    const privateChannelName = `private-rider-${riderData.id}`;
    const channel = pusherClient.subscribe(privateChannelName);

    channel.bind("pusher:subscription_succeeded", () => {
      console.log(
        "✅ SUBSCRIBED to private rider channel:",
        privateChannelName
      );
    });

    channel.bind("delivery.assigned", (payload: any) => {
      console.log("📥 delivery.assigned payload:", payload);
      // Refresh rider data and notify — **do not open drawer** (Uber style)
      queryClient.invalidateQueries({ queryKey: ["riderData"] });
      toast({
        title: "New Delivery Assigned",
        description: "A delivery was assigned to you.",
      });
    });

    channel.bind("pusher:subscription_error", (err: any) => {
      console.error("❌ PRIVATE RIDER AUTH ERROR", err);
    });

    return () => {
      try {
        pusherClient.unsubscribe(privateChannelName);
      } catch {}
    };
  }, [riderData?.id, queryClient, toast]);

  // === Subscribe to presence-nearby channels (zone + neighbors) ===
  useEffect(() => {
    if (!isActive || !riderData?.isActive) return;

    // cleanup any existing watch first
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // helper: subscribe to a single channel name (idempotent)
    const subscribeChannel = (channelName: string) => {
      if (subscribedChannelsRef.current.has(channelName)) return;

      const ch = pusherClient.subscribe(channelName);
      subscribedChannelsRef.current.add(channelName);

      ch.bind("pusher:subscription_succeeded", () => {
        console.log("✅ SUBSCRIBED to", channelName);
      });
      ch.bind("pusher:subscription_error", (err: any) => {
        console.error("❌ SUBSCRIPTION ERROR on", channelName, err);
      });

      // Offer handler
      const onOffer = (payload: any) => {
        console.log("🔥 OFFER RECEIVED on", channelName, payload);

        // Basic de-duplication: skip if we already have this id
        setOffers((prev) => {
          if (prev.some((p) => p.id === payload.id)) return prev;
          return [payload, ...prev];
        });

        // If drawer empty (no active offer), show this one immediately
        setDrawerOffer((cur: any) => {
          if (!cur) {
            setIsDrawerOpen(true);
            return payload;
          }
          // keep existing drawerOffer; queue the new one
          return cur;
        });

        // Haptic + toast
        try {
          navigator.vibrate?.(200);
        } catch {}
        // toast({
        //   title: "New Delivery Offer",
        //   description: `${payload.itemName} • ₦${payload.fee}`,
        // });
      };

      ch.bind("offer.new", onOffer);

      // store cleanup info on the channel object for explicit unbind if needed
      // (pusherClient.unsubscribe will remove binds, but keep explicit unbinds safe)
      (ch as any).__onOfferHandler = onOffer;
    };

    // helper: unsubscribe a channel
    const unsubscribeChannel = (channelName: string) => {
      if (!subscribedChannelsRef.current.has(channelName)) return;
      try {
        const ch = pusherClient.channel(channelName) as any;
        if (ch && ch.__onOfferHandler)
          ch.unbind("offer.new", ch.__onOfferHandler);
      } catch {}
      try {
        pusherClient.unsubscribe(channelName);
      } catch {}
      subscribedChannelsRef.current.delete(channelName);
      console.log("🧹 Unsubscribed", channelName);
    };

    // function to set subscriptions based on position
    const setSubscriptionsForPosition = (lat: number, lng: number) => {
      const baseHash = encodeGeoHash4(lat, lng); // parent-level hash (4 chars)
      if (!baseHash) return;

      // if already subscribed to this base hash, skip re-subscribe
      if (zoneHash === baseHash && subscribedChannelsRef.current.size > 0) {
        return;
      }

      // compute neighbors (8 cells) and subscribe to base + neighbors
      const neighbors = getGeoHashNeighbors(baseHash) || [];
      const allHashes = [baseHash, ...neighbors];

      // unsubscribe channels not in new set
      Array.from(subscribedChannelsRef.current).forEach((chName) => {
        const chHash = chName.replace("presence-nearby-", "");
        if (!allHashes.includes(chHash)) unsubscribeChannel(chName);
      });

      // subscribe to new channels
      allHashes.forEach((h) => subscribeChannel(`presence-nearby-${h}`));

      setZoneHash(baseHash);
      console.log("Subscribed to zone group:", allHashes);
    };

    // start geolocation watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setSubscriptionsForPosition(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.error("Geolocation watch error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    // cleanup on unmount or when toggling offline
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // unsubscribe all subscribed channels
      Array.from(subscribedChannelsRef.current).forEach((chName) => {
        unsubscribeChannel(chName);
      });
      subscribedChannelsRef.current.clear();
      setZoneHash(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, riderData?.isActive]); // only re-run when online/offline toggles or rider activation changes

  useEffect(() => {
    if (drawerOffer) {
      setIsDrawerOpen(true);
    }
  }, [drawerOffer]);

  useEffect(() => {
    if (!isActive) {
      setIsDrawerOpen(false);
      setDrawerOffer(null);
    }
  }, [isActive]);

  // Accept / Decline handlers
  const acceptOffer = useCallback(
    async (itemId: string) => {
      try {
        const res = await fetch(`/api/rider/accept-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderItemId: itemId }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || `Accept failed (${res.status})`);
        }

        // Close drawer, clear that offer and refresh data
        setIsDrawerOpen(false);
        setDrawerOffer(null);
        setOffers((prev) =>
          prev.filter((o) => (o.orderItemId || o.id) !== itemId)
        );
        queryClient.invalidateQueries({ queryKey: ["riderData"] });
        toast({
          title: "Delivery accepted",
          description: "Go pick up the order.",
        });
      } catch (err: any) {
        console.error("Accept error:", err);
        toast({
          title: "Accept failed",
          description: err?.message || "Could not accept delivery",
          variant: "destructive",
        });
      }
    },
    [queryClient, toast]
  );

  const declineOffer = useCallback(async (offerId: string) => {
    try {
      // Optional: call backend to mark declined (route: /api/delivery/{id}/decline)
      // await fetch(`/api/delivery/${offerId}/decline`, { method: "POST" }).catch(
      //   () => {}
      // );
    } finally {
      // Remove offer from queue and close drawer if it's the active one
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      setDrawerOffer((cur: any) =>
        cur && (cur.orderItemId || cur.id) === offerId ? null : cur
      );
      setIsDrawerOpen(false);
    }
  }, []);

  // Toggle online state
  const toggleOnline = useCallback(async () => {
    const newState = !isActive;
    setIsActive(newState);
    setLoading(true);
    try {
      const res = await fetch("/api/rider", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newState }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to update status");
      }
      toast({ title: newState ? "You're now online" : "You're now offline" });
      // invalidate to refresh available offers or active deliveries
      queryClient.invalidateQueries({ queryKey: ["riderData"] });
    } catch (err: any) {
      setIsActive((s) => !s);
      toast({
        title: "Status update failed",
        description: err?.message || "Could not change status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isActive, toast, queryClient]);

  if (isLoading) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-8">
        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-[#0d1c12] dark:text-[#e7f4eb] text-4xl font-black leading-tight tracking-[-0.033em]">
              Welcome back, {riderData?.firstName}!
            </h2>
            <p className="text-[#757575] dark:text-[#a0b4a8] text-base font-normal leading-normal">
              Here's your performance summary.
            </p>
          </div>

          <Button
            className={`text-base font-semibold capitalize p-3 rounded-xl min-w-[120px] ${
              !isActive
                ? "bg-green-600 text-white hover:bg-green-700 shadow-xl"
                : "bg-red-500 text-white hover:bg-red-600 shadow-xl"
            }`}
            onClick={toggleOnline}
            aria-pressed={isActive}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isActive ? (
              "Go Offline"
            ) : (
              "Go Online"
            )}
          </Button>
        </div>

        {/* Page content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column */}
          <div className="lg:col-span-2 space-y-6">
            <div className=" grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* <Card className="flex flex-col items-stretch justify-between gap-2.5 rounded-xl bg-gray-50 dark:bg-[#13ec6a]/5 shadow-sm border border-gray-200 dark:border-[#13ec6a]/20">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="text-gray-900 dark:text-white text-base font-bold leading-tight">
                    You are {!isActive ? "offline" : "online"}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-[#13ec6a]/70 text-sm font-normal leading-normal">
                    {!isActive
                      ? "Go online to start receiving orders."
                      : "You are available to receive new delivery requests."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="default"
                    className={`text-base font-semibold capitalize p-2 rounded-md ${
                      !isActive
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-500 text-black hover:bg-gray-200"
                    }`}
                    onClick={toggleOnline}
                    aria-pressed={isActive}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      "go offline"
                    ) : (
                      "go online"
                    )}
                  </Button>
                </CardContent>
              </Card> */}

              <Card className="flex flex-col items-stretch justify-between gap-2.5 rounded-xl bg-gray-50 dark:bg-[#13ec6a]/5 shadow-sm border border-gray-200 dark:border-[#13ec6a]/20">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="text-gray-700 dark:text-white font-sans text-base font-medium leading-normal">
                    Acceptance Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
                    95%
                  </p>
                </CardContent>
              </Card>

              <Card className="flex flex-col items-stretch justify-between gap-2.5 rounded-xl bg-gray-50 dark:bg-[#13ec6a]/5 shadow-sm border border-gray-200 dark:border-[#13ec6a]/20">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="text-gray-700 dark:dark:text-white font-sans text-base font-medium leading-normal">
                    Rider Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight flex items-center">
                    4.8
                    <Star className="inline-block w-5 h-5 text-yellow-400 ml-1 fill-yellow-400" />
                  </p>
                </CardContent>
              </Card>
            </div>
            <Tabs defaultValue="daily" className="w-full">
              <Card className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-[#13ec6a]/20 bg-gray-50 dark:bg-[#13ec6a]/5 w-full">
                <div className="space-y-2">
                  <CardHeader className="grid grid-cols-2 items-center justify-between gap-4 w-full">
                    <CardTitle className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                      Earning Summary
                    </CardTitle>

                    <TabsList className="col-span-1 flex items-center rounded-lg bg-gray-200 dark:bg-[#13ec6a]/10 p-1 text-sm font-semibold">
                      <TabsTrigger
                        value="daily"
                        className="px-3 py-1 rounded-md text-gray-500 dark:text-[#13ec6a]/70  data-[state=active]:dark:bg-[#13ec6a]/30 data-[state=active]:text-gray-900 data-[state=active]:dark:text-white shadow-sm data-[state=active]:bg-[#13ec6a]"
                      >
                        Daily
                      </TabsTrigger>
                      <TabsTrigger
                        value="weekly"
                        className="px-3 py-1 rounded-md text-gray-500 dark:text-[#13ec6a]/70  dark:data-[state=active]:bg-primary/30 data-[state=active]:text-gray-900 data-[state=active]:dark:text-white shadow-sm data-[state=active]:bg-[#13ec6a]"
                      >
                        Weekly
                      </TabsTrigger>
                      <TabsTrigger
                        value="monthly"
                        className="px-3 py-1 rounded-md text-gray-500 dark:text-[#13ec6a]/70  dark:data-[state=active]:bg-primary/30 data-[state=active]:text-gray-900 data-[state=active]:dark:text-white shadow-sm data-[state=active]:bg-[#13ec6a]"
                      >
                        Monthly
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <hr className="border-t border-gray-200 dark:border-[#13ec6a]/20 w-[95%] mx-auto" />
                </div>

                <TabsContent value="daily" className="w-full mt-2">
                  <CardContent>
                    <h1 className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
                      {formatCurrencyValue(riderEarnings.today || 0)}
                    </h1>
                    <p className="text-gray-600 dark:text-[#13ec6a]/70 mt-1">
                      Today earnings so far
                    </p>
                  </CardContent>
                </TabsContent>

                <TabsContent value="weekly" className="w-full mt-2">
                  <CardContent>
                    <h1 className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
                      {formatCurrencyValue(riderEarnings.week || 0)}
                    </h1>
                    <p className="text-gray-600 dark:text-[#13ec6a]/70 mt-1">
                      This week's earnings so far
                    </p>
                  </CardContent>
                </TabsContent>

                <TabsContent value="monthly" className="w-full mt-2">
                  <CardContent>
                    <h1 className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
                      {formatCurrencyValue(riderEarnings.month || 0)}
                    </h1>
                    <p className="text-gray-600 dark:text-[#13ec6a]/70 mt-1">
                      This month earnings so far
                    </p>
                  </CardContent>
                </TabsContent>
              </Card>
            </Tabs>
          </div>

          {/* right column */}
          <div
            className="lg:col-span-1 flex flex-col gap-6"
            id="active-delivery-panel"
          >
            {activeDelivery ? (
              <Card className="flex flex-col items-stretch justify-between gap-2.5 rounded-xl bg-gray-50 dark:bg-[#13ec6a]/5 shadow-sm border border-gray-200 dark:border-[#13ec6a]/20">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="text-gray-900 dark:text-white text-base font-bold leading-tight tracking-[-0.015em]">
                    Active Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1">
                  <div className="flex-[3_3_0%] flex flex-col gap-4 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {activeDelivery?.orderItem.store.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-[#13ec6a]/70">
                          Order #
                          {activeDelivery?.orderItem.orderId
                            .substring(0, 5)
                            .toUpperCase()}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                        In Transit
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 text-sm">
                      <div className="flex items-start gap-3">
                        <StoreIcon className="w-5 h-5 text-[#13ec6a]/80 mt-0.5 text-[18px]" />
                        <div className="flex flex-col">
                          <p className="font-semibold text-base text-gray-600 dark:text-[#13ec6a]/80">
                            PICKUP
                          </p>
                          <p className="text-gray-800 dark:text-white">
                            123 Market St, Downtown
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPinHouse className="w-5 h-5 text-[#13ec6a]/80 mt-0.5 text-[18px]" />
                        <div className="flex flex-col">
                          <p className="font-semibold text-base text-gray-600 dark:text-[#13ec6a]/80">
                            DELIVERY
                          </p>
                          <p className="text-gray-800 dark:text-white">
                            {activeDelivery?.orderItem.order.address.street},
                            {activeDelivery?.orderItem.order.address.city},{" "}
                            {activeDelivery?.orderItem.order.address.state}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundImage: `url("https://placeholder.pics/svg/300")`,
                      }}
                      className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
                      data-alt="A map showing the route from pickup to drop-off"
                      data-location="Anytown"
                    ></div>

                    <Link
                      href={`/logistics/rider/delivery/${activeDelivery.id}`}
                      className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg py-2 h-12 px-4 bg-[#13ec6a] text-black gap-2 text-sm font-bold leading-normal tracking-[0.015em]"
                    >
                      <span className="truncate">Navigate</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6 bg-blue-50 dark:bg-gray-800 h-full flex flex-col justify-center items-center text-center">
                <MapPin className="w-12 h-12 text-green-500 dark:text-green-400 mb-4" />
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  No Active Delivery
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Go online to get a new delivery offer!
                </CardDescription>
                {isActive && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-4">
                    Searching for offers...
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      <NewDeliveryDrawer
        offer={drawerOffer}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAccept={acceptOffer}
        onDecline={declineOffer}
        onAccepted={(offer) => {
          const el = document.getElementById("active-delivery-panel");
          el?.classList.add("animate-pulse");

          setTimeout(() => {
            el?.classList.remove("animate-pulse");
          }, 1000);
        }}
      />
    </main>
  );
};

export default RiderDashboard;
