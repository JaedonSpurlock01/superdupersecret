import Link from "next/link";
import Section from "./section";
import { getAllBlogs } from "@/lib/blog";
import { AnimatedTextLink } from "./ui/animated-text-link";

export default async function Writings() {
    const posts = (await getAllBlogs()).slice(0, 3);

    return (
        <Section title="WRITINGS">
            <div className="relative mt-8 space-y-4">
                <ul className="flex flex-col gap-8">
                    {posts.map((post) => (
                        <li key={post.slug}>
                            <Link
                                href={`/blogs/${post.slug}`}
                                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6">
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-semibold leading-tight tracking-tight">
                                            <span className="inline-block max-w-full truncate border-b border-transparent transition-colors group-hover:border-foreground">
                                                {post.title}
                                            </span>
                                        </h2>
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                            {post.summary}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                        <time dateTime={post.publishedAt}>
                                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </time>
                                        <span aria-hidden="true">·</span>
                                        <span>{post.readingMinutes} min read</span>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="pt-2 text-xs">
                    <AnimatedTextLink href="/blogs">More writings</AnimatedTextLink>
                </div>
            </div>
        </Section>
    );
}