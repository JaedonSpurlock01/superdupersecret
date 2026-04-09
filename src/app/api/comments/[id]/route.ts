import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isCommentAdmin } from "@/lib/comments/admin";
import { prisma } from "@/lib/prisma";

function canModifyComment(
  authorId: string,
  userId: string | undefined,
): boolean {
  return Boolean(userId && authorId === userId);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uid = session.user.id;
  if (!canModifyComment(comment.authorId, uid) && !isCommentAdmin(uid)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "body" in body &&
    typeof body.body === "string"
      ? body.body
      : "";

  const trimmed = text.trim();
  if (trimmed.length < 1 || trimmed.length > 20_000) {
    return NextResponse.json({ error: "Invalid body length" }, { status: 400 });
  }

  if (canModifyComment(comment.authorId, uid)) {
    const authorName = session.user.name?.trim() || comment.authorName;
    const authorImage = session.user.image ?? comment.authorImage;
    await prisma.comment.update({
      where: { id },
      data: {
        body: trimmed,
        authorName,
        authorImage,
      },
    });
    return NextResponse.json({
      ok: true,
      id,
      body: trimmed,
      author: {
        id: comment.authorId,
        name: authorName,
        image: authorImage,
      },
    });
  }

  await prisma.comment.update({
    where: { id },
    data: { body: trimmed },
  });
  return NextResponse.json({
    ok: true,
    id,
    body: trimmed,
    author: {
      id: comment.authorId,
      name: comment.authorName,
      image: comment.authorImage,
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uid = session.user.id;
  if (!canModifyComment(comment.authorId, uid) && !isCommentAdmin(uid)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
