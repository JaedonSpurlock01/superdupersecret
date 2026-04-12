"use client";

import { useEffect, useRef, useState } from "react";

type BlogPostEngagementProps = {
  slug: string;
  initialCommentCount: number;
  initialViewCount: number;
};

function scrollToComments() {
  document
    .getElementById("comments")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function BlogPostEngagement({
  slug,
  initialCommentCount,
  initialViewCount,
}: BlogPostEngagementProps) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/blog/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { viewCount?: number };
        if (typeof data.viewCount === "number") {
          setViewCount(data.viewCount);
        }
      } catch {
        // keep initialViewCount
      }
    })();
  }, [slug]);

  const commentLabel =
    initialCommentCount === 1 ? "1 comment" : `${initialCommentCount} comments`;
  const viewLabel = viewCount === 1 ? "1 view" : `${viewCount} views`;

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Discussion
      </dt>
      <dd className="mt-2 space-y-1.5 text-neutral-700 dark:text-neutral-300">
        <div>
          <button
            type="button"
            onClick={scrollToComments}
            className="text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            {commentLabel}
          </button>
        </div>
        <div>{viewLabel}</div>
      </dd>
    </div>
  );
}
