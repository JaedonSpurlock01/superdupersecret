import Link from "next/link";
import type { Components } from "react-markdown";

export const commentMarkdownComponents: Partial<Components> = {
  a: ({ href = "", ...props }) => {
    const isInternal = href.startsWith("/") || href.startsWith("#");
    if (isInternal) {
      return <Link href={href} {...props} />;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
    );
  },
  code: ({ className, ...props }) => {
    const dataLanguage =
      "data-language" in props
        ? props["data-language" as keyof typeof props]
        : undefined;
    const isFencedBlock =
      (typeof className === "string" &&
        /\blanguage-[\w-]+\b/.test(className)) ||
      typeof dataLanguage === "string";
    if (isFencedBlock) {
      return <code className={className} {...props} />;
    }
    return (
      <code
        className={[
          "rounded-sm bg-muted px-1.5 py-0.5 text-[0.85em]",
          className ?? "",
        ].join(" ")}
        {...props}
      />
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={[
        "shiki-pre overflow-x-auto rounded-sm border border-border bg-muted/40 p-4 font-mono text-sm [&_.line]:block",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  ),
  figure: ({ className, ...props }) => (
    <figure
      className={["my-6 not-prose", className ?? ""].join(" ")}
      {...props}
    />
  ),
};
