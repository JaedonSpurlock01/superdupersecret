import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await ctx.params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.commentLike.findUnique({
    where: {
      commentId_userId: { commentId, userId: session.user.id },
    },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.commentLike.create({
      data: { commentId, userId: session.user.id },
    });
  }

  const likeCount = await prisma.commentLike.count({ where: { commentId } });

  return NextResponse.json({
    liked: !existing,
    likeCount,
  });
}
