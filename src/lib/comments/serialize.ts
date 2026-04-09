import type { Comment, CommentLike } from "@/generated/prisma/client";
import type {
  CommentAuthorJson,
  CommentReplyJson,
  CommentThreadJson,
} from "./api-types";

type CommentRow = Pick<
  Comment,
  | "id"
  | "body"
  | "createdAt"
  | "pinned"
  | "parentId"
  | "authorId"
  | "authorName"
  | "authorImage"
>;

export function toAuthorJson(c: CommentRow): CommentAuthorJson {
  return {
    id: c.authorId,
    name: c.authorName,
    image: c.authorImage,
  };
}

export function buildLikeMaps(
  likesAgg: { commentId: string; _count: number }[],
  myLikes: Pick<CommentLike, "commentId">[],
) {
  const countMap = new Map<string, number>();
  for (const row of likesAgg) {
    countMap.set(row.commentId, row._count);
  }
  const mine = new Set(myLikes.map((l) => l.commentId));
  return {
    likeCount: (id: string) => countMap.get(id) ?? 0,
    likedByMe: (id: string) => mine.has(id),
  };
}

export function toReplyJson(
  c: CommentRow,
  likeCount: number,
  likedByMe: boolean,
): CommentReplyJson {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    author: toAuthorJson(c),
    likeCount,
    likedByMe,
  };
}

export function toThreadJson(
  c: CommentRow,
  likeCount: number,
  likedByMe: boolean,
  replyCount: number,
  replies: CommentReplyJson[],
): CommentThreadJson {
  const hiddenReplyCount = Math.max(0, replyCount - replies.length);
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    pinned: c.pinned,
    author: toAuthorJson(c),
    likeCount,
    likedByMe,
    replyCount,
    hiddenReplyCount,
    replies,
  };
}
