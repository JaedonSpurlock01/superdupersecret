import type { MetadataRoute } from "next";
import { getAllBlogs } from "@/lib/blog";
import { isDatabaseAvailable } from "@/lib/database-availability";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaedonspurlock.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, databaseAvailable] = await Promise.all([
    getAllBlogs(),
    isDatabaseAvailable(),
  ]);

  const staticBase = ["", "/about", "/blogs", "/books"];
  const staticRoutes = [
    ...staticBase,
    ...(databaseAvailable ? ["/guestbook"] : []),
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const blogRoutes = posts.map((post) => ({
    url: `${siteUrl}/blogs/${post.slug}`,
    lastModified: post.updatedAt ?? post.lastModified,
  }));

  return [...staticRoutes, ...blogRoutes];
}
