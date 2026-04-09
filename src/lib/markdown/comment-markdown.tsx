"use client";

import ReactMarkdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import { cn } from "@/lib/utils";
import { commentMarkdownComponents } from "./comment-markdown-components";

// rehype-pretty-code is async; react-markdown runs the pipeline synchronously.

const rehypePlugins = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: "append" }],
];

export function CommentMarkdown({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins as PluggableList}
        components={commentMarkdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
