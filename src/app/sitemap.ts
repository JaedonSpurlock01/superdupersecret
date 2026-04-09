import type { MetadataRoute } from "next";
import { getAllBlogs } from "@/lib/blog";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaedonspurlock.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogs();

  const staticRoutes = ["", "/about", "/blogs", "/guestbook"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const blogRoutes = posts.map((post) => ({
    url: `${siteUrl}/blogs/${post.slug}`,
    lastModified: post.updatedAt ?? post.lastModified,
  }));

  return [...staticRoutes, ...blogRoutes];
}
