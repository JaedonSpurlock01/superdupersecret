import { getPrismaClient } from "@/lib/prisma";

export async function getBlogPostStats(slug: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { commentCount: 0, viewCount: 0 };
  }
  try {
    const [commentCount, viewRow] = await Promise.all([
      prisma.comment.count({ where: { postSlug: slug } }),
      prisma.blogPostView.findUnique({ where: { postSlug: slug } }),
    ]);
    return {
      commentCount,
      viewCount: viewRow?.viewCount ?? 0,
    };
  } catch {
    return { commentCount: 0, viewCount: 0 };
  }
}
