/** Matches MDX filenames used as blog slugs (e.g. `hello-world`, `my.post`). */
export const BLOG_SLUG_RE = /^[\w.-]+$/;

export function isValidBlogSlug(slug: string): boolean {
  return slug.length > 0 && BLOG_SLUG_RE.test(slug);
}
