"use client";
import { useEffect, useState } from "react";

export function useRiderLocation(intervalMs = 15000) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });

          fetch("/api/rider/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    };

    updatePosition();
    const id = setInterval(updatePosition, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return coords;
}
