import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["media.graphassets.com", "via.placeholder.com"],
    unoptimized: true,
  },
};

export default nextConfig;
