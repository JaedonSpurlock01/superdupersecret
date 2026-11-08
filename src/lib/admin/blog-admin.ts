import matter from "gray-matter";
import { ValidationError } from "@/lib/content-types";
import { compileBlogMdx } from "@/lib/mdx/compile-blog-mdx";
import {
  commitRepoFiles,
  type FileChange,
  listRepoDir,
  readRepoFile,
} from "./content-store";

export const BLOG_DIR = "content/blog";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type AdminBlogPost = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  content: string;
};

export type AdminBlogListItem = Omit<AdminBlogPost, "content">;

export function assertSlug(slug: string): string {
  if (!SLUG_RE.test(slug)) {
    throw new ValidationError(
      "Slug must be lowercase letters, numbers, and single dashes",
    );
  }
  return slug;
}

function blogPath(slug: string): string {
  return `${BLOG_DIR}/${assertSlug(slug)}.mdx`;
}

function toIso(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function parse(slug: string, raw: string): AdminBlogPost {
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? ""),
    summary: String(data.summary ?? data.subtitle ?? ""),
    publishedAt: toIso(data.publishedAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(data.updatedAt),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    content: content.replace(/^\n+/, ""),
  };
}

export async function listAdminBlogs(): Promise<AdminBlogListItem[]> {
  const files = (await listRepoDir(BLOG_DIR)).filter((f) =>
    f.toLowerCase().endsWith(".mdx"),
  );
  const posts = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.mdx$/i, "");
      const raw = await readRepoFile(`${BLOG_DIR}/${file}`);
      if (raw == null) return null;
      const { content: _content, ...item } = parse(slug, raw);
      return item;
    }),
  );
  return posts
    .filter((p): p is AdminBlogListItem => p !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getAdminBlog(
  slug: string,
): Promise<AdminBlogPost | null> {
  const raw = await readRepoFile(blogPath(slug));
  return raw == null ? null : parse(slug, raw);
}

function validatePost(input: unknown): AdminBlogPost {
  const p = (input ?? {}) as Record<string, unknown>;
  const title = typeof p.title === "string" ? p.title.trim() : "";
  const summary = typeof p.summary === "string" ? p.summary.trim() : "";
  const content = typeof p.content === "string" ? p.content : "";
  if (!title) throw new ValidationError("Title is required");
  if (!summary) throw new ValidationError("Summary is required");
  if (!content.trim()) throw new ValidationError("Content is required");
  const publishedAt = toIso(p.publishedAt);
  if (!publishedAt) throw new ValidationError("Published date is invalid");
  const tags = Array.isArray(p.tags)
    ? p.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  return {
    slug: assertSlug(String(p.slug ?? "")),
    title,
    summary,
    publishedAt,
    updatedAt: toIso(p.updatedAt),
    tags,
    content,
  };
}

function serialize(post: AdminBlogPost): string {
  const frontmatter: Record<string, unknown> = {
    title: post.title,
    summary: post.summary,
    publishedAt: post.publishedAt,
    tags: post.tags,
  };
  if (post.updatedAt) frontmatter.updatedAt = post.updatedAt;
  return matter.stringify(`\n${post.content.trim()}\n`, frontmatter);
}

/**
 * Creates or updates a post. `originalSlug` is the slug being edited (null for
 * a new post); if it differs from the new slug, the old file is removed in the
 * same commit.
 */
export async function saveAdminBlog(
  input: unknown,
  originalSlug: string | null,
) {
  const post = validatePost(input);

  // Fail fast on MDX that would break the page (and the production build).
  try {
    await compileBlogMdx(post.content);
  } catch (err) {
    throw new ValidationError(
      `MDX failed to compile: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const renamed = originalSlug !== null && originalSlug !== post.slug;
  if (originalSlug === null || renamed) {
    if ((await readRepoFile(blogPath(post.slug))) != null) {
      throw new ValidationError(
        `A post with slug "${post.slug}" already exists`,
      );
    }
  }

  const changes: FileChange[] = [
    { path: blogPath(post.slug), content: serialize(post) },
  ];
  if (renamed) changes.push({ path: blogPath(originalSlug), delete: true });

  const verb = originalSlug === null ? "add" : "update";
  const result = await commitRepoFiles(
    changes,
    `content(blog): ${verb} "${post.title}" via admin`,
  );
  return { post, ...result };
}

export async function deleteAdminBlog(slug: string) {
  const path = blogPath(slug);
  if ((await readRepoFile(path)) == null) {
    throw new ValidationError(`Post "${slug}" not found`);
  }
  return commitRepoFiles(
    [{ path, delete: true }],
    `content(blog): delete "${slug}" via admin`,
  );
}
