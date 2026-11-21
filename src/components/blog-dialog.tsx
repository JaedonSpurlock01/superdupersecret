"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { CommentsSection } from "@/components/comments";
import { Badge } from "@/components/ui/badge";
import { HighlightList } from "@/components/ui/highlight-list";
import type { BlogListItem } from "@/lib/blog";
import { cn } from "@/lib/utils";

/**
 * The Writings list. A row grows into a reading card (view transition) that
 * holds the whole post — there is no separate blog page. Same shape as the
 * climb, book and About photo dialogs.
 *
 * `?post=<slug>` is kept in the address bar while a post is open and opens it
 * on load, so a post can still be linked to (the old /blogs URLs redirect
 * there, see next.config.ts).
 *
 * Styles live in globals.css under "Blog dialog".
 */

export type BlogEntry = BlogListItem & {
  /** The compiled MDX body. */
  content: ReactNode;
  stats: { commentCount: number; viewCount: number };
};

const FLIGHT_NAME = "blog-flight";
const POST_PARAM = "post";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const formatDate = (iso: string, month: "short" | "long") =>
  new Date(iso).toLocaleDateString("en-US", {
    month,
    day: "numeric",
    year: "numeric",
  });

/** Keeps `?post=` in step with the open post, without a navigation. */
function syncAddress(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set(POST_PARAM, slug);
  else url.searchParams.delete(POST_PARAM);
  url.hash = "";
  window.history.replaceState(window.history.state, "", url);
}

export function WritingsList({
  posts,
  databaseAvailable,
  homeTitle,
}: {
  posts: BlogEntry[];
  databaseAvailable: boolean;
  /** The tab title to go back to when a post closes. */
  homeTitle: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  // A row is only named around its own flight, so it stays out of unrelated
  // view transitions (theme toggle, music, books).
  const [armed, setArmed] = useState<string | null>(null);
  const busy = useRef(false);
  const rows = useRef(new Map<string, HTMLAnchorElement>());

  const go = (next: string | null, slug: string, instant = false) => {
    if (busy.current) return;
    syncAddress(next);
    const settle = () => {
      if (!next) rows.current.get(slug)?.focus({ preventScroll: true });
    };
    if (instant || !document.startViewTransition) {
      flushSync(() => setOpen(next));
      settle();
      return;
    }
    busy.current = true;
    const root = document.documentElement;
    // Reduced motion: nothing is named, so the page just crossfades.
    if (!prefersReducedMotion()) {
      flushSync(() => setArmed(slug));
      root.dataset.blogFlight = next ? "open" : "close";
    }
    const transition = document.startViewTransition(() => {
      flushSync(() => setOpen(next));
    });
    // A hidden tab skips the animation and rejects `ready`; the state change
    // still happens, so there is nothing to handle.
    transition.ready.catch(() => {});
    transition.updateCallbackDone.then(settle, settle);
    transition.finished.finally(() => {
      delete root.dataset.blogFlight;
      busy.current = false;
      setArmed(null);
    });
  };

  // A link straight to a post opens it once the page is up, with its row
  // scrolled into view behind it so closing lands somewhere that makes sense.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get(POST_PARAM);
    if (!slug) return;
    const row = rows.current.get(slug);
    if (!row) {
      syncAddress(null);
      return;
    }
    row.scrollIntoView({ block: "center" });
    setOpen(slug);
  }, []);

  const post = posts.find((p) => p.slug === open);

  return (
    <>
      <HighlightList className="flex flex-col gap-8">
        {posts.map((p) => (
          <li key={p.slug}>
            <a
              href={`/?${POST_PARAM}=${encodeURIComponent(p.slug)}`}
              ref={(el) => {
                if (el) rows.current.set(p.slug, el);
                else rows.current.delete(p.slug);
              }}
              onClick={(event) => {
                // Let new-tab and new-window clicks through; the link opens
                // the post there.
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                go(p.slug, p.slug);
              }}
              className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div
                className={cn(
                  "blog-flight flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6",
                  open === p.slug && "invisible",
                )}
                style={{
                  viewTransitionName:
                    armed === p.slug && open !== p.slug
                      ? FLIGHT_NAME
                      : undefined,
                }}
              >
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold leading-6 tracking-tight">
                    {p.title}
                  </h2>
                  <p className="line-clamp-2 text-base leading-6 text-muted-foreground">
                    {p.summary}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm leading-6 text-muted-foreground">
                  <time dateTime={p.publishedAt}>
                    {formatDate(p.publishedAt, "short")}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{p.readingMinutes} min read</span>
                </div>
              </div>
            </a>
          </li>
        ))}
      </HighlightList>

      {post && (
        <BlogDialog
          post={post}
          named={armed === post.slug}
          databaseAvailable={databaseAvailable}
          homeTitle={homeTitle}
          onClose={(instant) => go(null, post.slug, instant)}
        />
      )}
    </>
  );
}

/** Posts already counted in this page load (Strict Mode mounts twice). */
const counted = new Set<string>();

function useViewCount(slug: string, initial: number, enabled: boolean) {
  const [views, setViews] = useState(initial);
  useEffect(() => {
    if (!enabled || counted.has(slug)) return;
    counted.add(slug);
    void fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { viewCount?: number } | null) => {
        if (typeof data?.viewCount === "number") setViews(data.viewCount);
      })
      .catch(() => {});
  }, [slug, enabled]);
  return views;
}

function BlogDialog({
  post,
  named,
  databaseAvailable,
  homeTitle,
  onClose,
}: {
  post: BlogEntry;
  /** Whether the flight's view-transition name is on. */
  named: boolean;
  databaseAvailable: boolean;
  homeTitle: string;
  onClose: (instant?: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const views = useViewCount(
    post.slug,
    post.stats.viewCount,
    databaseAvailable,
  );
  const { commentCount } = post.stats;

  // Layout effect so the dialog is already in the top layer when the view
  // transition takes its "after" snapshot.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    root.style.paddingRight = `${scrollbar}px`;
    ref.current?.showModal();
    return () => {
      root.style.overflow = "";
      root.style.paddingRight = "";
    };
  }, []);

  // The tab says which post is open, like the page it replaced.
  useEffect(() => {
    document.title = post.title;
    return () => {
      document.title = homeTitle;
    };
  }, [post.title, homeTitle]);

  return createPortal(
    <dialog
      ref={ref}
      className="blog-dialog"
      aria-labelledby="blog-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        // Escape is a keyboard action: close at once, no flight.
        onClose(true);
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click; Esc and the close button cover keyboard */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[3px] dark:bg-black/65"
        onClick={() => onClose()}
      />
      <div className="pointer-events-none relative flex h-full items-center justify-center p-3 sm:p-8">
        <div
          className="blog-flight pointer-events-auto relative flex h-full max-h-[52rem] w-[min(100%,44rem)] flex-col overflow-hidden rounded-xl bg-background shadow-2xl shadow-black/40 ring-1 ring-border"
          style={{ viewTransitionName: named ? FLIGHT_NAME : undefined }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => onClose()}
            className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-[background-color,color,scale] duration-150 ease-(--ease-out) hover:bg-muted hover:text-foreground active:scale-95"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
              <path
                d="M3.5 3.5l9 9m0-9l-9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="overflow-y-auto overscroll-contain px-5 pt-5 pb-12 sm:px-10 sm:pt-10">
            <h2
              id="blog-dialog-title"
              className="pr-10 text-2xl font-semibold tracking-tight"
            >
              {post.title}
            </h2>
            <p className="mt-2 text-base leading-6 text-muted-foreground">
              {post.summary}
            </p>

            <p className="mt-4 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt, "long")}
              </time>
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
              {databaseAvailable && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{views === 1 ? "1 view" : `${views} views`}</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("comments")?.scrollIntoView({
                        behavior: prefersReducedMotion() ? "auto" : "smooth",
                        block: "start",
                      })
                    }
                    className="cursor-pointer underline-offset-2 transition-colors duration-150 hover:text-foreground hover:underline"
                  >
                    {commentCount === 1
                      ? "1 comment"
                      : `${commentCount} comments`}
                  </button>
                </>
              )}
            </p>

            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-sm border-0 bg-neutral-200 text-[10px] font-normal text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <hr className="my-8 border-border" />

            <article className="blog-prose prose prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline">
              {post.content}
            </article>

            {databaseAvailable && <CommentsSection slug={post.slug} />}
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
