import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "api.aq-fes.com",
      "example.com",
      "staterestaurant.com",
      "staterestaurantequipment.com",
      "cdn.staterestaurant.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.aq-fes.com",
        port: "",
        pathname: "/products-api/resources/**",
      },
    ],
  },
};

export default nextConfig;
