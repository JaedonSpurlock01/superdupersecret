import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaedonspurlock.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticBase = [
    "",
    "/books",
    "/spurlock-labs",
    "/spurlock-labs/privacy",
    "/spurlock-labs/terms",
  ];
  const staticRoutes = staticBase.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  return staticRoutes;
}
