import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: process.env.NODE_ENV === "production" ? "https" : "http",
        hostname: process.env.MINIO_ENDPOINT || "localhost",
        port:
          process.env.NODE_ENV === "production"
            ? process.env.MINIO_PORT
            : "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "prod-dodo-backend-test-mode.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "prod-dodo-backend-live-mode.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
    ],
  },
};

export default nextConfig;
