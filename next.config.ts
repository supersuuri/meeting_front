import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "meeting-app-navy.vercel.app" },
      { protocol: "http", hostname: "Localhost:3000" },
      { protocol: "http", hostname: "192.168.56.1:3000" },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    config.cache = { type: "filesystem" };
    return config;
  },
};

export default nextConfig;
