import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "api.aq-fes.com",
      "example.com",
      "staterestaurant.com",
      "staterestaurantequipment.com",
      "cdn.staterestaurant.com",
      "localhost",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.aq-fes.com",
        port: "",
        pathname: "/products-api/resources/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  assetPrefix: "/StateApp",
  trailingSlash: true,
};

export default nextConfig;
