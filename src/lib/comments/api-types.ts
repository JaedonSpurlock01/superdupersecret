/** JSON shape returned by GET /api/comments and nested in replies. */
export type CommentAuthorJson = {
  id: string;
  name: string;
  image: string | null;
};

export type CommentReplyJson = {
  id: string;
  body: string;
  createdAt: string;
  author: CommentAuthorJson;
  likeCount: number;
  likedByMe: boolean;
};

export type CommentThreadJson = {
  id: string;
  body: string;
  createdAt: string;
  pinned: boolean;
  author: CommentAuthorJson;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  hiddenReplyCount: number;
  replies: CommentReplyJson[];
};

export type CommentsListJson = {
  comments: CommentThreadJson[];
};

export type MoreRepliesJson = {
  replies: CommentReplyJson[];
  nextCursor: string | null;
};
