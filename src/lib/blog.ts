import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

export type BlogMetadata = {
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  updatedAt?: string;
};

export type BlogPost = BlogMetadata & {
  slug: string;
  content: string;
  lastModified: string;
  readingMinutes: number;
  wordCount: number;
};

export type BlogListItem = Omit<BlogPost, "content">;

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

async function readAllMdxFiles() {
  const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mdx"))
    .map((e) => path.join(BLOG_DIR, e.name));
}

function toIsoDate(input: string | undefined): string {
  if (!input) return new Date(0).toISOString();
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return new Date(0).toISOString();
  return date.toISOString();
}

function parseBlogFile(raw: string, fallbackSlug: string, lastModified: Date) {
  const parsed = matter(raw);
  const data = parsed.data as Partial<BlogMetadata> & { subtitle?: string };
  const title = data.title?.trim();
  const summary = (data.summary ?? data.subtitle)?.trim();
  const publishedAt = toIsoDate(data.publishedAt);
  const tags = Array.isArray(data.tags)
    ? data.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const updatedAt = data.updatedAt ? toIsoDate(data.updatedAt) : undefined;

  if (!title || !summary) {
    throw new Error(
      "Invalid blog frontmatter. Expected `title` and `summary` strings.",
    );
  }

  const content = parsed.content.trim();
  const stats = readingTime(content);
  const wordCount = stats.words;
  const readingMinutes = Math.max(1, Math.ceil(stats.minutes));

  return {
    title,
    summary,
    publishedAt,
    tags,
    updatedAt,
    slug: fallbackSlug,
    content,
    wordCount,
    readingMinutes,
    lastModified: lastModified.toISOString(),
  };
}

export async function getAllBlogs(): Promise<BlogListItem[]> {
  const files = await readAllMdxFiles();
  const posts = await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, "utf8");
      const stat = await fs.stat(filePath);
      const slug = path.basename(filePath, ".mdx");
      return parseBlogFile(raw, slug, stat.mtime);
    }),
  );

  return posts
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .map(({ content: _content, ...item }) => item);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  try {
    const [raw, stat] = await Promise.all([
      fs.readFile(filePath, "utf8"),
      fs.stat(filePath),
    ]);
    return parseBlogFile(raw, slug, stat.mtime);
  } catch {
    return null;
  }
}
