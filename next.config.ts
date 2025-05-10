import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'meeting-app-navy.vercel.app' }
    ]
  },
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  webpack(config) {
    config.cache = { type: "filesystem" };
    return config;
  },
};

export default nextConfig;
