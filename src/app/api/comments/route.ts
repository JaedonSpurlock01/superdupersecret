import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import type { Comment } from "@/generated/prisma/client";
import { auth } from "@/auth";
import type { CommentsListJson } from "@/lib/comments/api-types";
import {
  buildLikeMaps,
  toReplyJson,
  toThreadJson,
} from "@/lib/comments/serialize";
import { isValidBlogSlug } from "@/lib/comments/slug";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const REPLY_PAGE = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim() ?? "";
  if (!isValidBlogSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const session = await auth();
    const userId = session?.user?.id;

    const topLevel = await prisma.comment.findMany({
      where: { postSlug: slug, parentId: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    const topIds = topLevel.map((c) => c.id);
    if (topIds.length === 0) {
      const body: CommentsListJson = { comments: [] };
      return NextResponse.json(body);
    }

    // Only fetch the latest REPLY_PAGE rows per thread (avoids loading every reply when threads are huge).
    const allReplies = await prisma.$queryRaw<Comment[]>`
      SELECT "id", "postSlug", "body", "createdAt", "pinned", "parentId", "authorId", "authorName", "authorImage"
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (
            PARTITION BY "parentId"
            ORDER BY "createdAt" DESC, "id" DESC
          ) AS "_reply_rn"
        FROM "Comment"
        WHERE "parentId" IN (${Prisma.join(topIds)})
      ) AS "_sub"
      WHERE "_reply_rn" <= ${REPLY_PAGE}
    `;

    const byParent = new Map<string, typeof allReplies>();
    for (const r of allReplies) {
      if (!r.parentId) continue;
      const arr = byParent.get(r.parentId) ?? [];
      arr.push(r);
      byParent.set(r.parentId, arr);
    }
    for (const [pid, arr] of byParent) {
      arr.sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime() ||
          b.id.localeCompare(a.id),
      );
      byParent.set(pid, arr.slice(0, REPLY_PAGE));
    }

    const replyCounts = await prisma.comment.groupBy({
      by: ["parentId"],
      where: { parentId: { in: topIds } },
      _count: { _all: true },
    });
    const replyCountMap = new Map<string, number>();
    for (const row of replyCounts) {
      if (row.parentId) replyCountMap.set(row.parentId, row._count._all);
    }

    const displayedReplyIds = [...byParent.values()].flat().map((r) => r.id);
    const allIdsForLikes = [...topIds, ...displayedReplyIds];

    const [likesAgg, myLikes] = await Promise.all([
      prisma.commentLike.groupBy({
        by: ["commentId"],
        where: { commentId: { in: allIdsForLikes } },
        _count: { _all: true },
      }),
      userId
        ? prisma.commentLike.findMany({
            where: { userId, commentId: { in: allIdsForLikes } },
            select: { commentId: true },
          })
        : Promise.resolve([]),
    ]);

    const likeAggRows = likesAgg.map((r) => ({
      commentId: r.commentId,
      _count: r._count._all,
    }));
    const { likeCount, likedByMe } = buildLikeMaps(likeAggRows, myLikes);

    const comments: CommentsListJson["comments"] = topLevel.map((c) => {
      const slice = byParent.get(c.id) ?? [];
      const chronological = [...slice].reverse();
      const replies = chronological.map((r) =>
        toReplyJson(r, likeCount(r.id), likedByMe(r.id)),
      );
      return toThreadJson(
        c,
        likeCount(c.id),
        likedByMe(c.id),
        replyCountMap.get(c.id) ?? 0,
        replies,
      );
    });

    return NextResponse.json({ comments } satisfies CommentsListJson);
  } catch (err) {
    console.error("[GET /api/comments]", err);
    const dev = process.env.NODE_ENV === "development";
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error:
          "Could not load comments. Check DATABASE_URL and that this app can reach your Postgres instance.",
        ...(dev ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const slug =
    "slug" in body && typeof body.slug === "string" ? body.slug.trim() : "";
  const text = "body" in body && typeof body.body === "string" ? body.body : "";
  const parentId =
    "parentId" in body && typeof body.parentId === "string"
      ? body.parentId.trim()
      : null;

  if (!isValidBlogSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const trimmed = text.trim();
  if (trimmed.length < 1 || trimmed.length > 20_000) {
    return NextResponse.json({ error: "Invalid body length" }, { status: 400 });
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parent || parent.postSlug !== slug) {
      return NextResponse.json({ error: "Invalid parent" }, { status: 400 });
    }
    if (parent.parentId !== null) {
      return NextResponse.json(
        { error: "Only one level of replies allowed" },
        { status: 400 },
      );
    }
  }

  const authorName = session.user.name?.trim() || "GitHub user";
  const authorImage = session.user.image ?? null;

  const created = await prisma.comment.create({
    data: {
      postSlug: slug,
      body: trimmed,
      parentId: parentId || null,
      authorId: session.user.id,
      authorName,
      authorImage,
      pinned: false,
    },
  });

  return NextResponse.json({
    id: created.id,
    createdAt: created.createdAt.toISOString(),
  });
}
