import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/env";
import { TOOL_CATEGORIES } from "@/config/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/about",
    "/extension",
    "/tools",
    "/tools/comment-picker",
    "/tools/thumbnail-downloader",
    "/tools/url-analyzer",
    "/tools/image-compressor",
    "/tools/image-converter",
    "/tools/image-resizer",
    "/tools/video-to-thumbnail",
    "/tools/video-to-gif",
    "/tools/audio-converter",
    "/tools/audio-compressor",
    "/tools/audio-metadata",
    "/tools/url-cleaner",
    "/tools/social-links",
    "/tools/qr-generator",
    ...TOOL_CATEGORIES.map((category) => category.href),
  ];
  return pages.map((path) => ({
    url: `${appConfig.url}${path}`,
    lastModified: new Date(),
  }));
}
