import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/extension"];
  return pages.map((path) => ({
    url: `${appConfig.url}${path}`,
    lastModified: new Date(),
  }));
}
