import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://ginevrarenier.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/sign-in"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
