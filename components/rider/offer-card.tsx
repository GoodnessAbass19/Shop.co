"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Timer, MapPin, DollarSign } from "lucide-react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Offer {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  estimatedEarnings: number;
  distance?: number;
  eta?: number;
  expiresAt: string;
}

interface Props {
  offer: Offer | null;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
}

export default function NewOfferPopup({ offer, onAccept, onReject }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [routeData, setRouteData] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Countdown logic
  useEffect(() => {
    if (!offer) return;
    const endTime = new Date(offer.expiresAt).getTime();
    const interval = setInterval(() => {
      const diff = endTime - Date.now();
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [offer]);

  // Fetch route from Mapbox Directions API
  useEffect(() => {
    if (!offer) return;

    const fetchRoute = async () => {
      const pickup = encodeURIComponent(offer.pickupLocation);
      const dropoff = encodeURIComponent(offer.dropoffLocation);

      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup};${dropoff}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await res.json();
      const route = data.routes[0];

      setRouteData({
        geometry: route.geometry,
        distance: (route.distance / 1000).toFixed(1),
        eta: Math.round(route.duration / 60),
      });
    };

    fetchRoute();
  }, [offer]);

  // Initialize mini-map with route
  useEffect(() => {
    if (!routeData || !mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [0, 0],
        zoom: 12,
        interactive: false,
      });
    }

    const map = mapRef.current;
    if (map.getSource("route")) {
      (map.getSource("route") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        geometry: routeData.geometry,
      });
    } else {
      map.on("load", () => {
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", geometry: routeData.geometry },
        });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#007aff",
            "line-width": 4,
          },
        });
      });
    }
  }, [routeData]);

  if (!offer) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={offer.id}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 80 }}
        className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-2xl p-5 z-50"
      >
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-center">
            🚨 New Delivery Offer
          </h2>

          <div className="space-y-2 text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="text-green-600 w-4 h-4" />
              <span>{offer.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-600 w-4 h-4" />
              <span>{offer.dropoffLocation}</span>
            </div>

            {routeData && (
              <div className="flex justify-between mt-3 text-sm">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  {offer.estimatedEarnings.toFixed(2)} NGN
                </span>
                <span>{routeData.distance} km</span>
                <span>{routeData.eta} min</span>
                <span className="flex items-center gap-1">
                  <Timer className="w-4 h-4 text-red-500" />
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>

          {/* Mini Map */}
          <div
            ref={mapContainer}
            className="w-full h-40 rounded-xl overflow-hidden mt-3"
          />

          <div className="flex gap-3 mt-4">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onAccept(offer.id)}
            >
              Accept
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={() => onReject(offer.id)}
            >
              Reject
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
