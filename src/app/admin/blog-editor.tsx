"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import type { AdminBlogListItem, AdminBlogPost } from "@/lib/admin/blog-admin";
import { cn } from "@/lib/utils";
import {
  adminFetch,
  Field,
  ImageInput,
  inputClass,
  SaveBar,
  savedMessage,
  slugify,
  TextField,
  useAdmin,
} from "./shared";

type Draft = Omit<AdminBlogPost, "tags"> & { tags: string };

function toDraft(post: AdminBlogPost): Draft {
  return { ...post, tags: post.tags.join(", ") };
}

function fromDraft(draft: Draft): AdminBlogPost {
  return {
    ...draft,
    tags: draft.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

function newDraft(): Draft {
  return {
    slug: "",
    title: "",
    summary: "",
    publishedAt: new Date().toISOString(),
    tags: "",
    content: "",
  };
}

export function BlogEditor({ initial }: { initial: AdminBlogListItem[] }) {
  const { mode, notify } = useAdmin();
  const [posts, setPosts] = useState(initial);
  /** Slug of the post being edited; "" = new post; null = list view. */
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [snippetUrl, setSnippetUrl] = useState("");

  const dirty =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);

  const open = async (slug: string) => {
    setLoading(true);
    try {
      const { data } = await adminFetch<{ data: AdminBlogPost }>(
        `/api/admin/blog/${slug}`,
      );
      setSaved(toDraft(data));
      setDraft(toDraft(data));
      setEditing(slug);
      setTab("write");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    const d = newDraft();
    setSaved(d);
    setDraft(d);
    setEditing("");
    setTab("write");
  };

  const close = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setEditing(null);
    setDraft(null);
    setSaved(null);
  };

  const save = async () => {
    if (!draft || editing === null) return;
    setSaving(true);
    try {
      const isNew = editing === "";
      const { post } = await adminFetch<{ post: AdminBlogPost }>(
        isNew ? "/api/admin/blog" : `/api/admin/blog/${editing}`,
        { method: isNew ? "POST" : "PUT", json: { data: fromDraft(draft) } },
      );
      const { content: _c, ...item } = post;
      setPosts((list) =>
        [
          ...list.filter((p) => p.slug !== editing && p.slug !== post.slug),
          item,
        ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
      );
      setSaved(toDraft(post));
      setDraft(toDraft(post));
      setEditing(post.slug);
      notify("success", savedMessage(mode, `“${post.title}”`));
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: AdminBlogListItem) => {
    if (
      !window.confirm(
        `Delete “${item.title}”? This removes content/blog/${item.slug}.mdx.`,
      )
    )
      return;
    try {
      await adminFetch(`/api/admin/blog/${item.slug}`, { method: "DELETE" });
      setPosts((list) => list.filter((p) => p.slug !== item.slug));
      if (editing === item.slug) {
        setEditing(null);
        setDraft(null);
        setSaved(null);
      }
      notify("success", savedMessage(mode, "Deletion"));
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (editing === null || draft === null) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Posts are MDX files in content/blog.
          </p>
          <Button type="button" variant="outline" size="lg" onClick={startNew}>
            + New post
          </Button>
        </div>
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {posts.map((post) => (
            <li key={post.slug} className="flex items-center gap-3 p-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                disabled={loading}
                onClick={() => void open(post.slug)}
              >
                <p className="truncate text-sm font-medium">{post.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  /blogs/{post.slug} ·{" "}
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => void open(post.slug)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void remove(post)}
              >
                Delete
              </Button>
            </li>
          ))}
          {posts.length === 0 && (
            <li className="p-6 text-center text-xs text-muted-foreground">
              No posts yet.
            </li>
          )}
        </ul>
      </div>
    );
  }

  const set = (patch: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));
  const isNew = editing === "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={close}>
          ← All posts
        </Button>
        {!isNew && (
          <a
            href={`/blogs/${editing}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:underline"
          >
            View live ↗
          </a>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Title"
          value={draft.title}
          onChange={(title) =>
            set(
              isNew && (!draft.slug || draft.slug === slugify(draft.title))
                ? { title, slug: slugify(title) }
                : { title },
            )
          }
        />
        <TextField
          label="Slug"
          value={draft.slug}
          hint={
            isNew
              ? "URL: /blogs/<slug>"
              : "Changing this renames the file (old URL and its comments/views won't follow)."
          }
          onChange={(slug) => set({ slug: slugify(slug) })}
        />
        <div className="sm:col-span-2">
          <TextField
            label="Summary"
            multiline
            rows={2}
            value={draft.summary}
            onChange={(summary) => set({ summary })}
          />
        </div>
        <Field label="Published">
          {(id) => (
            <input
              id={id}
              type="date"
              className={inputClass}
              value={draft.publishedAt.slice(0, 10)}
              onChange={(e) =>
                e.target.value &&
                set({
                  publishedAt: new Date(
                    `${e.target.value}T12:00:00.000Z`,
                  ).toISOString(),
                })
              }
            />
          )}
        </Field>
        <TextField
          label="Tags"
          value={draft.tags}
          hint="Comma-separated"
          onChange={(tags) => set({ tags })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 border-b border-border">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 px-3 py-1.5 text-xs capitalize",
                tab === t
                  ? "border-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "write" ? (
          <textarea
            aria-label="Post content (MDX)"
            className={cn(
              inputClass,
              "min-h-[60vh] resize-y font-mono text-xs leading-relaxed",
            )}
            value={draft.content}
            onChange={(e) => set({ content: e.target.value })}
            placeholder="Write Markdown / MDX here…"
          />
        ) : (
          <div className="min-h-[60vh] rounded-md border border-border p-4">
            <p className="mb-3 text-[11px] text-muted-foreground">
              Approximate Markdown preview. JSX components render on the live
              site, and MDX is validated when you save.
            </p>
            <article className="blog-prose prose prose-neutral max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {draft.content}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </div>

      <details className="rounded-md border border-border p-3">
        <summary className="cursor-pointer text-xs font-medium">
          Insert an image
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <ImageInput
            label="Image"
            folder="blog"
            value={snippetUrl}
            onChange={setSnippetUrl}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={!snippetUrl}
            onClick={() => {
              set({
                content: `${draft.content.trimEnd()}\n\n![](${snippetUrl})\n`,
              });
              setSnippetUrl("");
            }}
          >
            Append to post
          </Button>
        </div>
      </details>

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={() => void save()}
        onReset={() => setDraft(saved)}
        disabled={!draft.slug || !draft.title.trim() || !draft.summary.trim()}
      />
    </div>
  );
}
