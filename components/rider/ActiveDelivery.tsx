"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { LngLatBounds } from "mapbox-gl";
import { useTheme } from "next-themes";
import {
  CheckCircle,
  MessageSquareMore,
  Navigation,
  Phone,
  Route,
  ShoppingBag,
  Store,
} from "lucide-react";
import { add } from "date-fns";
import TimelineStep from "./Timeline";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import Link from "next/link";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { useRiderContext } from "@/hooks/use-rider-context";

function fitToRoute(map: mapboxgl.Map, bbox: number[]) {
  const bounds = new LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);

  map.fitBounds(bounds, {
    padding: { top: 80, bottom: 80, left: 80, right: 420 }, // right panel
    duration: 800,
  });
}

async function snapToRoad(points: [number, number][]) {
  const coords = points.map((p) => p.join(",")).join(";");

  const res = await fetch(
    `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${process
      .env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!}`
  );

  const data = await res.json();
  return data.matchings?.[0]?.geometry;
}

function animateMarker(marker: mapboxgl.Marker, from: number[], to: number[]) {
  const duration = 1000;
  let start = performance.now();

  function frame(time: number): void {
    const t = Math.min((time - start) / duration, 1);
    const lng = from[0] + (to[0] - from[0]) * t;
    const lat = from[1] + (to[1] - from[1]) * t;

    marker.setLngLat([lng, lat]);

    if (t < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function shouldReroute(
  last: { lat: number; lng: number } | null,
  current: { lat: number; lng: number }
) {
  if (!last) return true;

  const dx = last.lng - current.lng;
  const dy = last.lat - current.lat;
  const meters = Math.sqrt(dx * dx + dy * dy) * 111_000;

  return meters > 50; // reroute every 50m
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

type DeliveryResponse = {
  delivery: {
    id: string;
    status: string;
    rider: { lat: number; lng: number; payout: number };
    pickup: {
      lat: number;
      lng: number;
      address: string;
      storeName: string;
      storePhone: string;
    };
    dropoff: {
      lat: number;
      lng: number;
      address: string;
      recipientName: string;
      recipientPhone: string;
    };
    pickupCodeExpires: string;
    pickupCode: string;
  };
};

export default function RiderDeliveryMapPage({
  deliveryItemId,
}: {
  deliveryItemId: string;
}) {
  const { rider } = useRiderContext();
  const router = useRouter();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const riderMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const routeRef = useRef<any>(null);
  const gpsBufferRef = useRef<[number, number][]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const lastReroutePosRef = useRef<{ lat: number; lng: number } | null>(null);
  const didInitialFitRef = useRef(false);
  const { setTheme, theme } = useTheme();
  const in10Min = add(new Date(), { minutes: eta || 0 }).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  const [code, setCode] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const [delivery, setDelivery] = useState<DeliveryResponse["delivery"] | null>(
    null
  );
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(
    null
  );

  /* 1️⃣ Fetch delivery data */
  useEffect(() => {
    fetch(`/api/rider/delivery/${deliveryItemId}`)
      .then((res) => res.json())
      .then((data) => setDelivery(data.delivery));
  }, [deliveryItemId]);

  /* 2️⃣ Track rider live location */
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];

        // 🔥 Always set first position immediately
        if (!riderPos) {
          setRiderPos({ lat: point[1], lng: point[0] });
        }

        gpsBufferRef.current.push(point);

        if (gpsBufferRef.current.length >= 3) {
          snapToRoad(gpsBufferRef.current).then((geometry) => {
            if (!geometry?.coordinates?.length) return;

            const [lng, lat] =
              geometry.coordinates[geometry.coordinates.length - 1];

            setRiderPos({ lat, lng });
            gpsBufferRef.current = [];
          });
        }
      },
      console.error,
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  /* 3️⃣ Init map */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          lightPreset: "night",
          colorMotorways: "#2e89ff",
          showPedestrianRoads: true,
          show3dObjects: true,
        },
      },
      //   center: [riderPos?.lng!, riderPos?.lat!],
      zoom: 14,
    });

    mapRef.current.on("load", () => {
      setMapLoaded(true);

      const hour = new Date().getHours();
      let lightPreset: "day" | "dusk" | "night" | "dawn";

      if (hour >= 6 && hour < 18) lightPreset = "day";
      else if (hour >= 18 && hour < 20) lightPreset = "dusk";
      else if (hour >= 20 || hour < 4) lightPreset = "night";
      else lightPreset = "dawn";

      mapRef.current?.setConfigProperty("basemap", "lightPreset", lightPreset);
      setTheme(
        lightPreset === "night" || lightPreset === "dusk" ? "dark" : "light"
      );
    });
  }, []);

  /* 4️⃣ Draw route — runs when delivery or riderPos changes */
  useEffect(() => {
    if (
      !mapRef.current ||
      !mapLoaded ||
      !delivery ||
      !riderPos ||
      !shouldReroute(lastReroutePosRef.current, riderPos)
    )
      return;

    lastReroutePosRef.current = riderPos;

    const map = mapRef.current;

    const to =
      delivery.status === "READY_FOR_PICKUP"
        ? delivery.pickup
        : delivery.dropoff;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${riderPos.lng},${riderPos.lat};${to.lng},${to.lat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

    let cancelled = false;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const route = data?.routes?.[0];
        if (!route || !route.geometry) return;

        routeRef.current = route;

        const geojson: GeoJSON.Feature = {
          type: "Feature",
          geometry: route.geometry,
          properties: {},
        };

        if (map.getSource("route")) {
          (map.getSource("route") as mapboxgl.GeoJSONSource).setData(geojson);
        } else {
          map.addSource("route", { type: "geojson", data: geojson });

          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#13ec6a",
              "line-width": 6,
            },
          });
        }

        setEta(Math.round(route.duration / 60)); // minutes
        setDistance(Math.round(route.distance / 1000)); // km

        // Fit camera to route bbox if available
        if (
          route.bbox &&
          Array.isArray(route.bbox) &&
          route.bbox.length === 4
        ) {
          if (!didInitialFitRef.current) {
            fitToRoute(map, route.bbox);
            didInitialFitRef.current = true;
          }
        } else if (route.geometry.coordinates?.length) {
          // fallback to bounds from coordinates
          const coords = route.geometry.coordinates as [number, number][];
          const lats = coords.map((c) => c[1]);
          const lngs = coords.map((c) => c[0]);
          const bbox = [
            Math.min(...lngs),
            Math.min(...lats),
            Math.max(...lngs),
            Math.max(...lats),
          ];
          fitToRoute(map, bbox);
        }
      })
      .catch((err) => console.error("Directions fetch failed", err));

    return () => {
      cancelled = true;
    };
  }, [delivery, riderPos]);

  /* 5️⃣ Update rider marker */
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !riderPos) return;

    if (!riderMarkerRef.current) {
      riderMarkerRef.current = new mapboxgl.Marker({
        color: "#2563eb",
        rotationAlignment: "map",
      })
        .setLngLat([riderPos.lng, riderPos.lat])
        .addTo(mapRef.current);

      lastPosRef.current = riderPos;
      return;
    }

    if (!lastPosRef.current) return;

    animateMarker(
      riderMarkerRef.current,
      [lastPosRef.current.lng, lastPosRef.current.lat],
      [riderPos.lng, riderPos.lat]
    );

    lastPosRef.current = riderPos;
  }, [riderPos, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !riderPos || !mapLoaded) return;

    mapRef.current.easeTo({
      center: [riderPos.lng, riderPos.lat],
      zoom: 15.5,
      bearing: mapRef.current.getBearing(),
      pitch: 60,
      duration: 1000,
    });
  }, [riderPos, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Reset route + refit on status change
    didInitialFitRef.current = false;
    lastReroutePosRef.current = null;

    if (mapRef.current.getSource("route")) {
      (mapRef.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
        properties: {},
      });
    }

    // Update current timeline step based on delivery status
    switch (delivery?.status) {
      case "OUT_FOR_DELIVERY":
        setCurrentStep(2); // navigated to customer
        break;
      case "COMPLETED":
      case "DELIVERED":
        setCurrentStep(3); // final step
        break;
      case "READY_FOR_PICKUP":
      case "PENDING":
      case "ASSIGNED":
      default:
        setCurrentStep(0); // arrive at store / pickup flow
        break;
    }
  }, [delivery?.status]);

  // Confirm action with rider and advance step. If final step, call completion API.
  const confirmAndAdvanceStep = async () => {
    if (!delivery) return;

    if (currentStep === 0) {
      try {
        const res = await fetch(`/api/rider/delivery/${delivery.id}/pick-up`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pickupCode: code }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to complete delivery");
        }

        // optionally update UI
        const data = await res.json().catch(() => ({}));
        // advance to final state
        setCurrentStep((s) => Math.min(s + 2, steps.length - 1));
        // refresh delivery status
        setDelivery((prev) =>
          prev ? { ...prev, status: data.status || "OUT_FOR_DELIVERY" } : prev
        );
        setCode("");
        return;
      } catch (error: any) {
        console.error("Incorrect pickup code", error);
        alert(error?.message || "Failed to complete delivery");
        return;
      }
    }

    // If final step, call completion endpoint
    if (currentStep === steps.length - 1) {
      try {
        const res = await fetch(`/api/rider/delivery/${delivery.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to complete delivery");
        }

        // optionally update UI
        const data = await res.json().catch(() => ({}));
        // mark all steps completed (one past last index)
        setCurrentStep(steps.length);
        // refresh delivery status
        setDelivery((prev) =>
          prev ? { ...prev, status: data.status || "DELIVERED" } : prev
        );
        setCode("");
        return;
      } catch (error: any) {
        console.error("Complete delivery failed", error);
        alert(error?.message || "Failed to complete delivery");
        return;
      }
    }

    // otherwise just advance step
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const steps = [
    {
      id: 1,
      title: `Arrive at ${delivery?.pickup.storeName || "Store"}`,
      status: `${in10Min} Arrival`,
      icon: <Store className="w-4 h-4" />,
    },
    {
      id: 2,
      title: "Pick Up Order",
      status: "Awaiting Confirmation",
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      id: 3,
      title: "Navigate to Customer",
      status: `${in10Min} Arrival`,
      icon: <Route className="w-4 h-4 rotate-90" />,
    },
    {
      id: 4,
      title: "Complete Delivery",
      status: "Awaiting Confirmation",
      icon: <CheckCircle className="w-4 h-4" />,
    },
  ];

  if (!rider?.isActive || delivery?.status === "DELIVERED") {
    router.push("/logistics/rider/dashboard");
  }

  if (!delivery) {
    return (
      <section className="max-w-screen-2xl mx-auto mt-10 p-4 min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-300"></div>
        </div>
      </section>
    );
  }

  return (
    <div className="h-screen w-full grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-4 gap-3">
      <div className="h-[70vh] lg:min-h-screen w-full relative col-span-3">
        <div ref={mapContainerRef} className="h-full w-full" />
        <div className="absolute top-4 left-4 bg-white text-black p-4 rounded shadow space-y-2 w-64">
          <h2 className="font-semibold text-lg">Active Delivery</h2>
          {delivery ? (
            <>
              <p>
                <span className="font-medium">Status:</span> {delivery.status}
              </p>
              <p>
                <span className="font-medium">Pickup:</span>{" "}
                {delivery.pickup.address}
              </p>
              <p>
                <span className="font-medium">Dropoff:</span>{" "}
                {delivery.dropoff.address}
              </p>
              {eta && distance && (
                <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm shadow-lg">
                  ⏱ {eta} min • 📍 {distance} km
                </div>
              )}
            </>
          ) : (
            <p>Loading delivery details...</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 xl:col-span-1 h-screen flex flex-col gap-6 bg-[#f8fcf9] dark:bg-[#102216] p-2 mb-2 lg:overflow-y-auto">
        <div className="w-full flex flex-col gap-3 rounded-lg bg-[#ffffff] dark:bg-[#1a2c20] border border-[#e7f4eb] dark:border-[#2a3c30] p-6">
          <p className="text-[#0d1c12] dark:text-[#e7f4eb] text-3xl font-black leading-tight tracking-[-0.033em]">
            Order #{delivery?.id.slice(0, 5).toUpperCase()}
          </p>
          <p className="text-[#499c65] dark:text-[#cee8d7] text-base font-normal leading-normal">
            Estimated Payout: {formatCurrencyValue(delivery?.rider.payout)}
          </p>
        </div>

        <div className="flex flex-col rounded-lg bg-[#ffffff] dark:bg-[#1a2c20] border border-[#e7f4eb] dark:border-[#2a3c30] py-6 px-3">
          {steps.map((step, index) => (
            <TimelineStep
              key={step.id}
              icon={step.icon}
              title={step.title}
              status={step.status}
              isCurrent={index === currentStep}
              isCompleted={index < currentStep}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {delivery?.status !== "DELIVERED" ? (
          delivery?.status !== "OUT_FOR_DELIVERY" ? (
            <div className="flex flex-col rounded-lg bg-[#ffffff] dark:bg-[#1a2c20] border border-[#e7f4eb] dark:border-[#2a3c30] p-6 gap-4">
              <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                Pickup Details
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="font-medium font-sans text-base text-[#0d1c12] dark:text-[#e7f4eb]">
                    {delivery?.pickup.storeName}
                  </p>
                  <p className="text-[#499c65] dark:text-[#cee8d7] text-sm">
                    {delivery?.pickup.address}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`tel:${delivery?.pickup.storePhone}`}
                    className="flex size-10 items-center justify-center rounded-lg bg-[#0df259]/20 dark:bg-[#0df259]/30 text-[#0d1c12] dark:text-[#e7f4eb]"
                  >
                    <Phone className="w-5 h-5" />
                  </Link>
                  <button className="flex size-10 items-center justify-center rounded-lg bg-[#0df259]/20 dark:bg-[#0df259]/30 text-[#0d1c12] dark:text-[#e7f4eb]">
                    <MessageSquareMore className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col rounded-lg bg-[#ffffff] dark:bg-[#1a2c20] border border-[#e7f4eb] dark:border-[#2a3c30] p-6 gap-4">
              <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                Customer Details
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="font-medium font-sans text-base text-[#0d1c12] dark:text-[#e7f4eb]">
                    {delivery?.dropoff.recipientName}
                  </p>
                  <p className="text-[#499c65] dark:text-[#cee8d7] text-sm">
                    {delivery?.dropoff.address}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`tel:${delivery?.dropoff.recipientPhone}`}
                    className="flex size-10 items-center justify-center rounded-lg bg-[#0df259]/20 dark:bg-[#0df259]/30 text-[#0d1c12] dark:text-[#e7f4eb]"
                  >
                    <Phone className="w-5 h-5" />
                  </Link>
                  <button className="flex size-10 items-center justify-center rounded-lg bg-[#0df259]/20 dark:bg-[#0df259]/30 text-[#0d1c12] dark:text-[#e7f4eb]">
                    <MessageSquareMore className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        ) : null}

        {delivery?.status === "DELIVERED" ? (
          <div className="grid space-y-3">
            <p className="text-center text-green-600 font-semibold">
              {" "}
              Delivery Completed! Thank you for your service.
            </p>
            <Link
              href={"/logistics/rider/dashboard"}
              className="flex min-w-[84px] w-full lg:max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0df259] text-[#0d1c12] text-base font-bold leading-normal tracking-[0.015em]"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid space-y-3 ">
            <Input
              type="text"
              value={code}
              placeholder={
                currentStep === 0
                  ? "Input pick-up code here"
                  : "Input delivery confirmation code here"
              }
              onChange={(e: any) => {
                setCode(e.target.value);
              }}
            />
            <button
              onClick={confirmAndAdvanceStep}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0df259] text-[#0d1c12] text-base font-bold leading-normal tracking-[0.015em]"
              disabled={!delivery}
            >
              <span className="truncate">
                {currentStep === 0 ? "Confirm Pickup" : "Complete Delivery"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
