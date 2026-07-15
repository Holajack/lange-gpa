import type { MetadataRoute } from "next";

const description =
  "Comprehension-first language learning through pictures, listening, and guided practice.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nurilang",
    short_name: "Nurilang",
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0e0e12",
    theme_color: "#ff8a1e",
    lang: "en",
    categories: ["education"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
