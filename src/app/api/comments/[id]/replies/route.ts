import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { MoreRepliesJson } from "@/lib/comments/api-types";
import { buildLikeMaps, toReplyJson } from "@/lib/comments/serialize";
import { getPrismaClient } from "@/lib/prisma";

const PAGE = 10;

type CursorPayload = { t: string; i: string };

function decodeCursor(raw: string | null): CursorPayload | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const v = JSON.parse(json) as unknown;
    if (
      typeof v === "object" &&
      v !== null &&
      "t" in v &&
      "i" in v &&
      typeof (v as CursorPayload).t === "string" &&
      typeof (v as CursorPayload).i === "string"
    ) {
      return v as CursorPayload;
    }
  } catch {
    return null;
  }
  return null;
}

function encodeCursor(at: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ t: at.toISOString(), i: id }),
    "utf8",
  ).toString("base64url");
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return NextResponse.json(
      { error: "Comments are temporarily unavailable." },
      { status: 503 },
    );
  }

  const { id: threadId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const cursorRaw = searchParams.get("cursor");

  const parent = await prisma.comment.findUnique({
    where: { id: threadId },
  });
  if (!parent || parent.parentId !== null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  const cur = decodeCursor(cursorRaw);
  if (!cur) {
    return NextResponse.json(
      { error: "cursor is required (oldest visible reply)" },
      { status: 400 },
    );
  }

  const at = new Date(cur.t);
  const idPart = cur.i;
  if (Number.isNaN(at.getTime()) || !idPart) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const where = {
    parentId: threadId,
    OR: [
      { createdAt: { lt: at } },
      { AND: [{ createdAt: at }, { id: { lt: idPart } }] },
    ],
  };

  const batch = await prisma.comment.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE,
  });

  const ids = batch.map((r) => r.id);
  const [likesAgg, myLikes] = await Promise.all([
    prisma.commentLike.groupBy({
      by: ["commentId"],
      where: { commentId: { in: ids } },
      _count: { _all: true },
    }),
    userId
      ? prisma.commentLike.findMany({
          where: { userId, commentId: { in: ids } },
          select: { commentId: true },
        })
      : Promise.resolve([]),
  ]);

  const likeAggRows = likesAgg.map((r) => ({
    commentId: r.commentId,
    _count: r._count._all,
  }));
  const { likeCount, likedByMe } = buildLikeMaps(likeAggRows, myLikes);

  const chronological = [...batch].reverse();
  const replies = chronological.map((r) =>
    toReplyJson(r, likeCount(r.id), likedByMe(r.id)),
  );

  const oldestInBatch = batch[batch.length - 1];
  const hasMore =
    oldestInBatch !== undefined &&
    (await prisma.comment.findFirst({
      where: {
        parentId: threadId,
        OR: [
          { createdAt: { lt: oldestInBatch.createdAt } },
          {
            AND: [
              { createdAt: oldestInBatch.createdAt },
              { id: { lt: oldestInBatch.id } },
            ],
          },
        ],
      },
      select: { id: true },
    })) != null;

  const nextCursor =
    hasMore && oldestInBatch
      ? encodeCursor(oldestInBatch.createdAt, oldestInBatch.id)
      : null;

  const body: MoreRepliesJson = { replies, nextCursor };
  return NextResponse.json(body);
}
