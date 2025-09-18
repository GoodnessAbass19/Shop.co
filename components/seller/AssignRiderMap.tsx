"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Pusher from "pusher-js";
import { Card, CardContent } from "@/components/ui/card";
import { encodeGeoHash5 } from "@/lib/geohash";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: "/api/pusher",
});

interface AssignRiderMapProps {
  orderItemId: string;
  sellerLat: number;
  sellerLng: number;
  storeId: string;
}

type RiderLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

interface RiderDetails {
  id: string;
  name: string;
  phone: string;
}

export default function AssignRiderMap({
  orderItemId,
  sellerLat,
  sellerLng,
  storeId,
}: AssignRiderMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});
  const [mapReady, setMapReady] = useState(false);
  const [assignedRider, setAssignedRider] = useState<RiderLocation | null>(
    null
  );
  const [activeRiders, setActiveRiders] = useState<{
    [id: string]: RiderLocation;
  }>({});

  // --- 1. Initialize Map ---
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          lightPreset: "night",
          colorMotorways: "#2e89ff",
          showPedestrianRoads: true,
          show3dObjects: true,
        },
      },
      center: [sellerLng, sellerLat],
      zoom: 14,
    });

    map.current.on("load", () => {
      setMapReady(true);

      const hour = new Date().getHours();
      let lightPreset: "day" | "dusk" | "night" | "dawn";

      if (hour >= 6 && hour < 18) {
        lightPreset = "day";
      } else if (hour >= 18 && hour < 20) {
        lightPreset = "dusk";
      } else if (hour >= 20 || hour < 4) {
        lightPreset = "night";
      } else {
        lightPreset = "dawn";
      }

      // Set the lightPreset property safely
      if (map.current) {
        map.current.setConfigProperty("basemap", "lightPreset", lightPreset);
        // Seller marker
        new mapboxgl.Marker({ color: "blue" })
          .setLngLat([sellerLng, sellerLat])
          .setPopup(new mapboxgl.Popup().setText("Seller Location"))
          .addTo(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapReady(false);
    };
  }, [sellerLat, sellerLng]);

  // --- 2. Presence Channel (Nearby Riders) ---
  useEffect(() => {
    if (!mapReady) return;

    const geoHash = encodeGeoHash5(sellerLat, sellerLng);
    const channel = pusherClient.subscribe(`presence-nearby-${geoHash}`);

    channel.bind("pusher:subscription_succeeded", (members: any) => {
      const riders: { [id: string]: RiderLocation } = {};
      Object.values(members.members).forEach((m: any) => {
        riders[m.id] = {
          id: m.id,
          name: m.info.name,
          lat: m.info.lat,
          lng: m.info.lng,
        };
      });
      setActiveRiders(riders);
    });

    channel.bind("pusher:member_added", (member: any) => {
      setActiveRiders((prev) => ({
        ...prev,
        [member.id]: {
          id: member.id,
          name: member.info.name,
          lat: member.info.lat,
          lng: member.info.lng,
        },
      }));
    });

    channel.bind("pusher:member_removed", (member: any) => {
      setActiveRiders((prev) => {
        const updated = { ...prev };
        delete updated[member.id];
        return updated;
      });
    });

    // Optional: listen to "rider.location.update" events
    channel.bind("rider.location.update", (data: RiderLocation) => {
      setActiveRiders((prev) => ({
        ...prev,
        [data.id]: data,
      }));
    });

    return () => {
      pusherClient.unsubscribe(`presence-nearby-${geoHash}`);
    };
  }, [mapReady, sellerLat, sellerLng]);

  // --- 3. Private Seller Channel (Assignment) ---
  useEffect(() => {
    if (!mapReady) return;

    const sellerChannel = pusherClient.subscribe(`private-seller-${storeId}`);

    sellerChannel.bind(
      "order_item.assigned",
      (data: { orderItemId: string; riderId: string }) => {
        if (data.orderItemId === orderItemId) {
          fetch(`/api/rider/${data.riderId}`)
            .then((res) => res.json())
            .then((riderData) => {
              const rider: RiderLocation = {
                id: riderData.id,
                name: riderData.name,
                lat: riderData.latitude,
                lng: riderData.longitude,
              };
              setAssignedRider(rider);
              setActiveRiders((prev) => ({ ...prev, [rider.id]: rider }));
            });
        }
      }
    );

    return () => {
      pusherClient.unsubscribe(`private-seller-${storeId}`);
    };
  }, [mapReady, storeId, orderItemId]);

  // --- 4. Keep markers synced with active riders ---
  useEffect(() => {
    if (!mapReady || !map.current) return;

    Object.values(activeRiders).forEach((rider) => {
      if (markersRef.current[rider.id]) {
        // Update existing marker position
        markersRef.current[rider.id].setLngLat([rider.lng, rider.lat]);
      } else {
        // Add new marker
        const marker = new mapboxgl.Marker({
          color: assignedRider?.id === rider.id ? "red" : "green",
        })
          .setLngLat([rider.lng, rider.lat])
          .setPopup(
            new mapboxgl.Popup().setText(
              assignedRider?.id === rider.id
                ? `Assigned: ${rider.name}`
                : rider.name
            )
          )
          .addTo(map.current!);
        markersRef.current[rider.id] = marker;
      }
    });

    // Remove markers for riders no longer active
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeRiders[id]) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [activeRiders, assignedRider, mapReady]);

  return (
    <div className="space-y-3">
      <div ref={mapContainer} className="h-[400px] w-full rounded-lg" />
      {assignedRider && (
        <div className="p-3 border rounded-md bg-muted">
          <h4 className="font-semibold text-lg">Assigned Rider</h4>
          <p>
            <strong>{assignedRider.name}</strong>
          </p>
          <p>
            Lat: {assignedRider.lat}, Lng: {assignedRider.lng}
          </p>
        </div>
      )}
    </div>
  );
}
