import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Individual draw results and picker sessions are shareable by direct
        // link, but not meant to be crawled/indexed en masse.
        disallow: ["/api/", "/draw/", "/y/", "/r/", "/i/", "/watch"],
      },
    ],
    sitemap: `${appConfig.url}/sitemap.xml`,
  };
}
