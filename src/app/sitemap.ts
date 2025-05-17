import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://app.schedowl.com";

  // Define all the routes
  const routes = [
    "",
    "/register",
    "/invitations",
    "/dashboard",
    "/drafts/draft",
    "/drafts/published",
    "/drafts/scheduled",
    "/calendar",
    "/media",
    "/settings/billing",
    "/settings/integrations",
    "/settings/members",
    "/settings/organisation",
    "/settings/profile",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : ("weekly" as "daily" | "weekly"),
    priority: route === "" ? 1 : 0.9,
  }));

  return routes;
}
