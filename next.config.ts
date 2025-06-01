import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: process.env.NODE_ENV === "production" ? "https" : "http",
        hostname: process.env.MINIO_ENDPOINT || "localhost",
        port: process.env.NODE_ENV === "production" ? undefined : "9000",
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://scripts.simpleanalyticscdn.com https://static.cloudflareinsights.com https://client.crisp.chat https://us-assets.i.posthog.com;
              connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com;
              img-src 'self' data: https:;
              style-src 'self' 'unsafe-inline';
              frame-src 'self';
            `
              .replace(/\s+/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
