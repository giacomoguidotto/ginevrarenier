import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/sign-in"],
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
