import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "@/../mdx-components";
import { CommentsSection } from "@/components/comments";
import { StaggerContainer } from "@/components/stagger-container";
import { Badge } from "@/components/ui/badge";
import { getAllBlogs, getBlogBySlug } from "@/lib/blog";
import { rehypePrettyCodeOptions } from "@/lib/mdx/rehype-pretty-code-options";
import { BlogPostBack } from "./blog-post-back";

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
    description: post.summary,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.content,
    components: useMDXComponents({}),
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append" }],
          [rehypePrettyCode, rehypePrettyCodeOptions],
        ],
      },
    },
  });

  return (
    <main className="min-h-screen px-4 lg:px-0 pt-20 pb-20">
      <StaggerContainer className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
          <aside className="md:col-span-2">
            <div className="md:sticky md:top-20 space-y-6">
              <header className="space-y-2">
                <BlogPostBack title="Writings" />

                <p>{post.title}</p>

                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  {post.summary}
                </p>
              </header>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Published
                  </dt>
                  <dd className="mt-1 text-neutral-700 dark:text-neutral-300">
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Reading Time
                  </dt>
                  <dd className="mt-1 text-neutral-700 dark:text-neutral-300">
                    {post.readingMinutes} min read
                  </dd>
                </div>
                {post.tags.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Tags
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] rounded-sm font-normal text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 border-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>

          <div className="md:col-span-3">
            <article className="blog-prose prose prose-neutral prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline max-w-none dark:prose-invert">
              {content}
            </article>
            <CommentsSection slug={slug} />
          </div>
        </div>
      </StaggerContainer>
    </main>
  );
}
