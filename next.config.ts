import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: process.env.NODE_ENV === "production" ? "https" : "http",
        hostname: process.env.MINIO_ENDPOINT || "localhost",
        port: process.env.NODE_ENV === "production" ? "" : "9000",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
