import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InkVision",
    short_name: "InkVision",
    description: "Encontre tatuadores, aprove a arte e veja a tatuagem na sua pele com IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#141416",
    theme_color: "#6d28d9",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
