import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.kay.com",
      },
      {
        protocol: "https",
        hostname: "images-aka.kay.com",
      },
    ],
  },
};

export default nextConfig;
