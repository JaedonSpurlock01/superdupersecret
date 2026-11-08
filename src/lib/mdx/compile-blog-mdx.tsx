import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "@/../mdx-components";
import { rehypePrettyCodeOptions } from "@/lib/mdx/rehype-pretty-code-options";

/** Compiles a blog post body (no frontmatter) with the site's MDX pipeline. */
export async function compileBlogMdx(source: string) {
  const { content } = await compileMDX({
    source,
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
  return content;
}
