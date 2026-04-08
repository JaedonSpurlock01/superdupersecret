import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { StaggerContainer } from "@/components/stagger-container";
import { getAllBlogs, getBlogBySlug } from "@/lib/blog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllBlogs();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.subtitle,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.content,
    options: { parseFrontmatter: false },
  });

  return (
    <main className="flex min-h-screen flex-col items-center pt-10 pb-20 px-4">
      <StaggerContainer className="w-full max-w-3xl">
        <div className="rounded-sm border border-border bg-white dark:bg-black p-4 mb-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {post.title}
            </h1>
            <p className="text-sm text-muted-foreground">{post.subtitle}</p>
            <div className="text-xs text-muted-foreground">
              {post.readingMinutes} min read
            </div>
          </header>
        </div>

        <article className="prose prose-neutral max-w-none dark:prose-invert">
          {content}
        </article>
      </StaggerContainer>
    </main>
  );
}
