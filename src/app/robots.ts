import type { MetadataRoute } from "next";

const privateRoutes = [
  "/__clerk",
  "/admin",
  "/api",
  "/courses",
  "/dashboard",
  "/events",
  "/forum",
  "/marketplace",
  "/messages",
  "/nurture",
  "/onboarding",
  "/practice",
  "/profile",
  "/schedule",
  "/session",
  "/sign-in",
  "/sign-up",
  "/trpc",
  "/wallet",
  "/world",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privateRoutes,
    },
    sitemap: "https://nurilang.app/sitemap.xml",
    host: "https://nurilang.app",
  };
}
