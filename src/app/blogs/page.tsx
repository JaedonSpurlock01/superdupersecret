import Link from "next/link";
import { StaggerContainer } from "@/components/stagger-container";
import { getAllBlogs } from "@/lib/blog";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";

export const metadata = {
  title: "Blog",
  description: "Writing and notes.",
};

export default async function BlogsIndexPage() {
  const posts = await getAllBlogs();

  return (
    <div className="min-h-screen px-4 lg:px-0 grid grid-cols-1 md:grid-cols-5 gap-20 pt-20 pb-20 max-w-4xl mx-auto">

      <StaggerContainer className="h-fit md:sticky md:top-6 md:col-span-2" delayStep={100}>
        <AnimatedTextLink href="/" arrowSide="left">My Writings</AnimatedTextLink>

        <p className="leading-relaxed text-xs text-neutral-700 dark:text-neutral-300 mt-2">
          My writings on software engineering, life, and more
        </p>
      </StaggerContainer>

      <StaggerContainer className="flex flex-col gap-4 md:col-span-3 md:pl-20" delayStep={100}>


        <ul className="flex flex-col gap-10">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blogs/${post.slug}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-medium tracking-tight underline-offset-4 group-hover:underline">
                      {post.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {post.summary}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <span aria-hidden="true">·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </StaggerContainer>
    </div>
  );
}
