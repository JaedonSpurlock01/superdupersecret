import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isCommentAdmin } from "@/lib/comments/admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !isCommentAdmin(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pinned =
    typeof body === "object" &&
    body !== null &&
    "pinned" in body &&
    typeof body.pinned === "boolean"
      ? body.pinned
      : null;

  if (pinned === null) {
    return NextResponse.json(
      { error: "Expected pinned boolean" },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.parentId !== null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.comment.update({
    where: { id },
    data: { pinned },
  });

  return NextResponse.json({ ok: true, pinned });
}
