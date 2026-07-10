import type { MetadataRoute } from "next";

const siteUrl = "https://www.sitemix.com.tr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/on-muhasebe",
        "/on-muhasebe/giris",
        "/on-muhasebe/kayit",
      ],
      disallow: [
        "/admin",
        "/api",
        "/on-muhasebe/panel",
        "/on-muhasebe/deneme-bitti",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
