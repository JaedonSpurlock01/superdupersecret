import { getAllBlogs, getBlogBySlug } from "@/lib/blog";
import { getBlogPostStats } from "@/lib/blog-stats";
import { info } from "@/lib/data/personal";
import { isDatabaseAvailable } from "@/lib/database-availability";
import { compileBlogMdx } from "@/lib/mdx/compile-blog-mdx";
import { type BlogEntry, WritingsList } from "./blog-dialog";
import Section from "./section";

/**
 * Every post, each ready to open in place. The bodies are compiled here so a
 * row can open straight into its post with nothing left to load.
 */
export default async function Writings() {
  const [list, databaseAvailable] = await Promise.all([
    getAllBlogs(),
    isDatabaseAvailable(),
  ]);

  const posts = (
    await Promise.all(
      list.map(async (item): Promise<BlogEntry | null> => {
        const post = await getBlogBySlug(item.slug);
        if (!post) return null;
        const [content, stats] = await Promise.all([
          compileBlogMdx(post.content),
          getBlogPostStats(item.slug),
        ]);
        return { ...item, content, stats };
      }),
    )
  ).filter((post) => post !== null);

  return (
    <Section title="WRITINGS">
      <div className="relative mt-8">
        <WritingsList
          posts={posts}
          databaseAvailable={databaseAvailable}
          homeTitle={info.name}
        />
      </div>
    </Section>
  );
}
