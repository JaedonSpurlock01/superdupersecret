"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminBlogListItem } from "@/lib/admin/blog-admin";
import type { Book } from "@/lib/book-utils";
import type { AboutContent, WorkItem } from "@/lib/content-types";
import { cn } from "@/lib/utils";
import { AboutEditor } from "./about-editor";
import { BlogEditor } from "./blog-editor";
import { BooksEditor } from "./books-editor";
import { AdminProvider, type StoreMode } from "./shared";
import { WorkEditor } from "./work-editor";

const TABS = [
  { id: "books", label: "Books" },
  { id: "about", label: "About me" },
  { id: "work", label: "Experience" },
  { id: "blog", label: "Blog" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const MODE_BANNER: Record<StoreMode, string> = {
  github:
    "Saves are committed to GitHub. The live site updates after the redeploy finishes.",
  local:
    "Local mode: saves write files in this working tree. Commit and push to publish.",
  none: "Editing is disabled: set ADMIN_GITHUB_TOKEN and ADMIN_GITHUB_REPO.",
};

export function AdminDashboard({
  mode,
  initial,
}: {
  mode: StoreMode;
  initial: {
    books: Book[];
    about: AboutContent;
    work: WorkItem[];
    blogs: AdminBlogListItem[];
  };
}) {
  const [tab, setTab] = useState<TabId>("books");

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash as TabId);
  }, []);

  const select = (id: TabId) => {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <AdminProvider mode={mode}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-10 pb-20 lg:px-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Edit site</h1>
          <Button type="button" variant="ghost" size="lg" onClick={logout}>
            Log out
          </Button>
        </div>

        <p
          className={cn(
            "rounded-md border px-3 py-2 text-xs",
            mode === "none"
              ? "border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {MODE_BANNER[mode]}
        </p>

        <nav
          className="flex gap-1 border-b border-border"
          aria-label="Sections"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                tab === t.id
                  ? "border-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Editors stay mounted so unsaved drafts survive tab switches. */}
        <div hidden={tab !== "books"}>
          <BooksEditor initial={initial.books} />
        </div>
        <div hidden={tab !== "about"}>
          <AboutEditor initial={initial.about} />
        </div>
        <div hidden={tab !== "work"}>
          <WorkEditor initial={initial.work} />
        </div>
        <div hidden={tab !== "blog"}>
          <BlogEditor initial={initial.blogs} />
        </div>
      </div>
    </AdminProvider>
  );
}
