import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/", "/admin", "/admin/appsumo"],
    },
    sitemap: "https://app.schedowl.com/sitemap.xml",
    host: "https://app.schedowl.com",
  };
}
