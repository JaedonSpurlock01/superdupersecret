import { prisma } from "@/lib/prisma";

export async function getBlogPostStats(slug: string) {
  const [commentCount, viewRow] = await Promise.all([
    prisma.comment.count({ where: { postSlug: slug } }),
    prisma.blogPostView.findUnique({ where: { postSlug: slug } }),
  ]);
  return {
    commentCount,
    viewCount: viewRow?.viewCount ?? 0,
  };
}
