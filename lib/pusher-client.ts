// lib/pusher-client.ts
import Pusher from "pusher-js";

const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;

if (!key || !cluster) {
  // In development you'll want a graceful fallback (no crash)
  console.warn("PUSHER not configured (NEXT_PUBLIC_PUSHER_KEY/CLUSTER).");
}

export const pusherClient = new Pusher(key || "", {
  cluster: cluster || "mt1",
  // authEndpoint: '/api/pusher/auth' // uncomment if using private channels
});
