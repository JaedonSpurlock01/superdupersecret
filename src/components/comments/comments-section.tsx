"use client";

import {
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Section from "@/components/section";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  CommentReplyJson,
  CommentsListJson,
  CommentThreadJson,
  MoreRepliesJson,
} from "@/lib/comments/api-types";
import { encodeReplyCursor } from "@/lib/comments/cursor";
import { CommentMarkdown } from "@/lib/markdown/comment-markdown";
import { cn } from "@/lib/utils";

type EditState =
  | null
  | { scope: "top"; commentId: string; draft: string }
  | { scope: "reply"; threadId: string; replyId: string; draft: string };

function UserAvatar({
  src,
  name,
  size = 24,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        {...dim}
        className="rounded-full object-cover ring-2 ring-background"
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background"
      style={dim}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function formatPostedAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CommentActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "-my-0.5 text-muted-foreground hover:text-foreground",
        )}
        aria-label="Comment actions"
      >
        <HugeiconsIcon
          icon={MoreHorizontalIcon}
          strokeWidth={2}
          className="size-4"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuItem onClick={onEdit}>
          <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MarkdownComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  disabled,
  placeholder,
  submitLabel = "Comment",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="rounded-sm border border-border bg-neutral-200/20 dark:bg-neutral-950/30">
      <div className="flex gap-1 border-b border-border px-2 pt-1">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={cn(
            "rounded-t-sm px-2 py-1 text-xs font-medium transition-colors",
            tab === "write"
              ? "border border-b-0 border-border bg-muted/50 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={cn(
            "rounded-t-sm px-2 py-1 text-xs font-medium transition-colors",
            tab === "preview"
              ? "border border-b-0 border-border bg-muted/50 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Preview
        </button>
      </div>
      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={5}
          className="w-full resize-y border-0 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-0 disabled:opacity-50"
        />
      ) : (
        <div className="min-h-[120px] px-3 py-2">
          {value.trim() ? (
            <CommentMarkdown
              markdown={value}
              className="prose blog-prose prose-sm dark:prose-invert max-w-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2 border-t border-border px-2 py-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          disabled={disabled || !value.trim()}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function LikeControl({
  count,
  liked,
  disabled,
  onToggle,
}: {
  count: number;
  liked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
        liked
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70",
        disabled && "cursor-default opacity-70 hover:bg-muted/40",
      )}
    >
      <span>Like</span>
      <span>{count}</span>
    </button>
  );
}

function ReplyThread({
  threadId,
  replies,
  hiddenReplyCount,
  authenticated,
  onLike,
  loadingMore,
  onLoadMore,
  edit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onStartEditReply,
  onDeleteReply,
  canModify,
  savingEdit,
}: {
  threadId: string;
  replies: CommentReplyJson[];
  hiddenReplyCount: number;
  authenticated: boolean;
  onLike: (id: string) => void;
  loadingMore: boolean;
  onLoadMore: () => void;
  edit: EditState;
  onEditDraftChange: (draft: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEditReply: (reply: CommentReplyJson) => void;
  onDeleteReply: (replyId: string) => void;
  canModify: (authorId: string) => boolean;
  savingEdit: boolean;
}) {
  const showMore = hiddenReplyCount > 0 && replies.length > 0;

  return (
    <div className="relative mt-3 space-y-3">
      {showMore && (
        <div className="relative flex gap-3 pl-0">
          <div className="relative z-10 flex w-6 shrink-0 justify-center">
            <span className="text-muted-foreground select-none text-xs leading-none">
              ⋮
            </span>
          </div>
          <button
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 disabled:opacity-50"
          >
            {loadingMore
              ? "Loading…"
              : `Show ${hiddenReplyCount} previous ${hiddenReplyCount === 1 ? "reply" : "replies"}`}
          </button>
        </div>
      )}

      <div className="relative space-y-3">
        <div className="pointer-events-none absolute left-3 top-0 bottom-0 w-px bg-border" />

        {replies.map((r) => {
          const editingReply =
            edit?.scope === "reply" &&
            edit.threadId === threadId &&
            edit.replyId === r.id;

          return (
            <div key={r.id} className="relative flex gap-3">
              <div className="relative z-10 flex size-6 shrink-0 justify-center pt-0.5">
                <UserAvatar src={r.author.image} name={r.author.name} />
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-neutral-700 dark:text-white">
                    {r.author.name}
                  </span>
                  <time
                    dateTime={r.createdAt}
                    className="text-xs text-muted-foreground underline decoration-border underline-offset-2"
                  >
                    {formatPostedAt(r.createdAt)}
                  </time>
                </div>
                <div className="mt-1">
                  {editingReply && edit ? (
                    <MarkdownComposer
                      value={edit.draft}
                      onChange={onEditDraftChange}
                      onSubmit={onSaveEdit}
                      onCancel={onCancelEdit}
                      submitLabel="Save"
                      disabled={savingEdit}
                      placeholder="Edit in Markdown…"
                    />
                  ) : (
                    <CommentMarkdown
                      markdown={r.body}
                      className="prose blog-prose prose-sm dark:prose-invert max-w-none"
                    />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <LikeControl
                    count={r.likeCount}
                    liked={r.likedByMe}
                    disabled={!authenticated}
                    onToggle={() => onLike(r.id)}
                  />
                  {authenticated && canModify(r.author.id) && !editingReply && (
                    <CommentActionsMenu
                      onEdit={() => onStartEditReply(r)}
                      onDelete={() => onDeleteReply(r.id)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CommentsSection({ slug }: { slug: string }) {
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";

  const [comments, setComments] = useState<CommentThreadJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerBody, setComposerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replySubmitting, setReplySubmitting] = useState<
    Record<string, boolean>
  >({});
  const [loadingMoreFor, setLoadingMoreFor] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
      const raw = (await res.json()) as CommentsListJson & {
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        const msg = [raw.error, raw.detail].filter(Boolean).join(" — ");
        throw new Error(msg || `Request failed (${res.status})`);
      }
      setComments(raw.comments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleLike = async (commentId: string) => {
    if (!authenticated) return;
    const res = await fetch(`/api/comments/${commentId}/like`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { liked: boolean; likeCount: number };
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            likeCount: data.likeCount,
            likedByMe: data.liked,
          };
        }
        const replyIdx = c.replies.findIndex((r) => r.id === commentId);
        if (replyIdx === -1) return c;
        const nextReplies = [...c.replies];
        nextReplies[replyIdx] = {
          ...nextReplies[replyIdx],
          likeCount: data.likeCount,
          likedByMe: data.liked,
        };
        return { ...c, replies: nextReplies };
      }),
    );
  };

  const submitTopLevel = async () => {
    const body = composerBody.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body }),
      });
      if (!res.ok) return;
      setComposerBody("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    const body = (replyDrafts[parentId] ?? "").trim();
    if (!body || replySubmitting[parentId]) return;
    setReplySubmitting((s) => ({ ...s, [parentId]: true }));
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body, parentId }),
      });
      if (!res.ok) return;
      setReplyDrafts((d) => ({ ...d, [parentId]: "" }));
      setReplyOpen((o) => ({ ...o, [parentId]: false }));
      await load();
    } finally {
      setReplySubmitting((s) => ({ ...s, [parentId]: false }));
    }
  };

  const loadMoreReplies = async (thread: CommentThreadJson) => {
    const oldest = thread.replies[0];
    if (!oldest) return;
    setLoadingMoreFor(thread.id);
    try {
      const cursor = encodeReplyCursor(oldest.createdAt, oldest.id);
      const res = await fetch(
        `/api/comments/${thread.id}/replies?cursor=${encodeURIComponent(cursor)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as MoreRepliesJson;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== thread.id) return c;
          return {
            ...c,
            replies: [...data.replies, ...c.replies],
            hiddenReplyCount: data.nextCursor
              ? Math.max(0, c.hiddenReplyCount - data.replies.length)
              : 0,
          };
        }),
      );
    } finally {
      setLoadingMoreFor(null);
    }
  };

  const togglePin = async (c: CommentThreadJson) => {
    if (!session?.user?.isCommentAdmin) return;
    const res = await fetch(`/api/comments/${c.id}/pin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !c.pinned }),
    });
    if (!res.ok) return;
    await load();
  };

  const canModify = (authorId: string) =>
    Boolean(
      session?.user?.id &&
        (session.user.id === authorId || session.user.isCommentAdmin),
    );

  const setEditDraft = (v: string) => {
    setEdit((e) => (e ? { ...e, draft: v } : null));
  };

  const saveEdit = async () => {
    if (!edit) return;
    const body = edit.draft.trim();
    if (!body) return;
    const id = edit.scope === "top" ? edit.commentId : edit.replyId;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) return;
      setEdit(null);
      await load();
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteComment = async (commentId: string, isTopLevel: boolean) => {
    const msg = isTopLevel
      ? "Delete this comment and all of its replies?"
      : "Delete this reply?";
    if (!confirm(msg)) return;
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setEdit(null);
    await load();
  };

  return (
    <Section id="comments" title="Comments" className="mt-16 scroll-mt-24">
      <div className="mt-6 rounded-sm dark:bg-card/20">
        {status === "unauthenticated" && (
          <div className="mb-6 rounded-sm border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="mb-3 text-neutral-700 dark:text-neutral-300">
              Sign in with GitHub to join the discussion.
            </p>
            <Button type="button" size="sm" onClick={() => signIn("github")}>
              Sign in with GitHub
            </Button>
          </div>
        )}

        {authenticated && (
          <div className="mb-8">
            <MarkdownComposer
              value={composerBody}
              onChange={setComposerBody}
              onSubmit={submitTopLevel}
              disabled={submitting}
              placeholder="Write a comment in Markdown…"
            />
          </div>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}

        <ul className="space-y-8">
          {comments.map((c) => {
            const editingTop = edit?.scope === "top" && edit.commentId === c.id;

            return (
              <li key={c.id} className="list-none">
                <div className="flex gap-3">
                  <div className="shrink-0 pt-0.5">
                    <UserAvatar
                      src={c.author.image}
                      name={c.author.name}
                      size={28}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-neutral-700 dark:text-white">
                          {c.author.name}
                        </span>
                        <time
                          dateTime={c.createdAt}
                          className="text-xs text-muted-foreground underline decoration-border underline-offset-2"
                        >
                          {formatPostedAt(c.createdAt)}
                        </time>
                        {c.pinned && (
                          <span className="rounded-sm border border-border bg-muted/50 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Pinned
                          </span>
                        )}
                      </div>
                      {session?.user?.isCommentAdmin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => togglePin(c)}
                        >
                          {c.pinned ? "Unpin" : "Pin"}
                        </Button>
                      )}
                    </div>

                    <div className="mt-2">
                      {editingTop && edit ? (
                        <MarkdownComposer
                          value={edit.draft}
                          onChange={setEditDraft}
                          onSubmit={saveEdit}
                          onCancel={() => setEdit(null)}
                          submitLabel="Save"
                          disabled={savingEdit}
                          placeholder="Edit in Markdown…"
                        />
                      ) : (
                        <CommentMarkdown
                          markdown={c.body}
                          className="prose blog-prose prose-sm dark:prose-invert max-w-none"
                        />
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <LikeControl
                        count={c.likeCount}
                        liked={c.likedByMe}
                        disabled={!authenticated}
                        onToggle={() => toggleLike(c.id)}
                      />
                      {authenticated && !editingTop && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyOpen((o) => ({
                                ...o,
                                [c.id]: !o[c.id],
                              }))
                            }
                            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {replyOpen[c.id] ? "Cancel" : "Reply"}
                          </button>
                          {canModify(c.author.id) && (
                            <CommentActionsMenu
                              onEdit={() =>
                                setEdit({
                                  scope: "top",
                                  commentId: c.id,
                                  draft: c.body,
                                })
                              }
                              onDelete={() => deleteComment(c.id, true)}
                            />
                          )}
                        </>
                      )}
                      {!authenticated && (
                        <span className="text-xs text-muted-foreground">
                          Sign in to reply
                        </span>
                      )}
                    </div>

                    {authenticated && replyOpen[c.id] && !editingTop && (
                      <div className="mt-4">
                        <MarkdownComposer
                          value={replyDrafts[c.id] ?? ""}
                          onChange={(v) =>
                            setReplyDrafts((d) => ({ ...d, [c.id]: v }))
                          }
                          onSubmit={() => submitReply(c.id)}
                          disabled={!!replySubmitting[c.id]}
                          placeholder="Write a reply in Markdown…"
                          submitLabel="Reply"
                        />
                      </div>
                    )}

                    {(c.replies.length > 0 || c.hiddenReplyCount > 0) && (
                      <ReplyThread
                        threadId={c.id}
                        replies={c.replies}
                        hiddenReplyCount={c.hiddenReplyCount}
                        authenticated={authenticated}
                        onLike={toggleLike}
                        loadingMore={loadingMoreFor === c.id}
                        onLoadMore={() => loadMoreReplies(c)}
                        edit={edit}
                        onEditDraftChange={setEditDraft}
                        onSaveEdit={saveEdit}
                        onCancelEdit={() => setEdit(null)}
                        onStartEditReply={(r) =>
                          setEdit({
                            scope: "reply",
                            threadId: c.id,
                            replyId: r.id,
                            draft: r.body,
                          })
                        }
                        onDeleteReply={(id) => deleteComment(id, false)}
                        canModify={canModify}
                        savingEdit={savingEdit}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
