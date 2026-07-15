import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://nurilang.app/",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://nurilang.app/early",
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
