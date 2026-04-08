import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type BlogFrontmatter = {
  title: string;
  subtitle: string;
};

export type BlogListItem = {
  title: string;
  subtitle: string;
  slug: string;
  readingMinutes: number;
  wordCount: number;
};

export type BlogPost = BlogListItem & {
  content: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function wordsCount(text: string) {
  const words = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .match(/\b[\p{L}\p{N}']+\b/gu);
  return words?.length ?? 0;
}

function readingMinutesFromWords(wordCount: number) {
  const WPM = 200;
  return Math.max(1, Math.ceil(wordCount / WPM));
}

export function slugFromTitle(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function readAllMdxFiles() {
  const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mdx"))
    .map((e) => path.join(BLOG_DIR, e.name));
}

function parseBlogFile(raw: string) {
  const parsed = matter(raw);
  const data = parsed.data as Partial<BlogFrontmatter>;
  const title = data.title?.trim();
  const subtitle = data.subtitle?.trim();

  if (!title || !subtitle) {
    throw new Error(
      "Invalid blog frontmatter. Expected `title` and `subtitle` strings.",
    );
  }

  const content = parsed.content.trim();
  const wordCount = wordsCount(content);
  const readingMinutes = readingMinutesFromWords(wordCount);
  const slug = slugFromTitle(title);

  return { title, subtitle, slug, content, wordCount, readingMinutes };
}

export async function getAllBlogs(): Promise<BlogListItem[]> {
  const files = await readAllMdxFiles();
  const posts = await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, "utf8");
      const { title, subtitle, slug, content, wordCount, readingMinutes } =
        parseBlogFile(raw);
      return { title, subtitle, slug, content, wordCount, readingMinutes };
    }),
  );

  return posts
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(({ content: _content, ...item }) => item);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const files = await readAllMdxFiles();

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = parseBlogFile(raw);
    if (parsed.slug === slug) return parsed;
  }

  return null;
}
