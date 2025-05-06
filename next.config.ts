import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'example.com' // Replace with your actual domain
        },
        {
            protocol: 'https',
            hostname: 'another-domain.com' // Replace with your actual domain
        }
    ]
  }
};

export default nextConfig;
