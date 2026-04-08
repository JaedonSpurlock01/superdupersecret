import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { getAllBlogs } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description: "Writing and notes.",
};

export default async function BlogsIndexPage() {
  const posts = await getAllBlogs();

  return (
    <main className="flex min-h-screen flex-col items-center pt-10 pb-20 px-4">
      <StaggerContainer className="w-full max-w-3xl">
        <section className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
            <p className="text-sm text-muted-foreground">
              MDX posts with title, subtitle, and reading time.
            </p>
          </div>

          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blogs/${post.slug}`}
                  className="block rounded-sm border border-border bg-white dark:bg-black p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-medium underline-offset-4">
                        {post.title}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {post.subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {post.readingMinutes} min read
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </StaggerContainer>
    </main>
  );
}
