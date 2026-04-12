"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CommentMarkdown } from "@/lib/markdown/comment-markdown";
import { cn } from "@/lib/utils";

export function GuestbookComposer({
  name,
  onNameChange,
  value,
  onChange,
  onSubmit,
  disabled,
  nameDisabled,
  placeholder = "Say hello or leave a short note…",
  submitLabel = "Post entry",
}: {
  name: string;
  onNameChange: (v: string) => void;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  nameDisabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="rounded-sm border border-border bg-neutral-200/20 dark:bg-neutral-950/30">
      <div className="border-b border-border px-3 py-2">
        <label
          htmlFor="guestbook-display-name"
          className="text-xs font-medium text-muted-foreground"
        >
          Display name
        </label>
        <input
          id="guestbook-display-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled || nameDisabled}
          maxLength={80}
          autoComplete="nickname"
          className="mt-1 w-full border-0 bg-transparent px-0 py-0.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-50"
          placeholder="How should we call you?"
        />
      </div>
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
        <Button
          type="button"
          size="sm"
          disabled={disabled || !name.trim() || !value.trim()}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
