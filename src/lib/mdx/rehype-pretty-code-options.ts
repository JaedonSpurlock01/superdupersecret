import type { Options } from "rehype-pretty-code";

/** Shared options for MDX fenced code highlighting (Shiki via rehype-pretty-code). */
export const rehypePrettyCodeOptions: Options = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  bypassInlineCode: true,
  defaultLang: "plaintext",
};
