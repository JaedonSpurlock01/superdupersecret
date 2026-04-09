"use client";

import { ArrowLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter } from "next/navigation";
import { APP_PREVIOUS_PATH_KEY } from "@/components/app-previous-path-tracker";

type BlogPostBackProps = {
  title: string;
  /** Used when there is no recorded in-app previous route (direct load, new tab, etc.). */
  fallbackHref?: string;
};

function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("/api/")) return false;
  return true;
}

export function BlogPostBack({
  title,
  fallbackHref = "/blogs",
}: BlogPostBackProps) {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = () => {
    try {
      const stored = sessionStorage.getItem(APP_PREVIOUS_PATH_KEY);
      if (
        stored &&
        isSafeInternalPath(stored) &&
        stored !== pathname
      ) {
        router.push(stored);
        return;
      }
    } catch {
      // ignore
    }
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="font-medium text-neutral-500 dark:text-neutral-400 group inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left transition-all duration-300"
    >
      <HugeiconsIcon
        icon={ArrowLeft}
        className="size-3.5 transition-all duration-400 group-hover:-translate-x-0.5 group-hover:text-black dark:group-hover:text-neutral-200"
      />
      <span className="line-clamp-1 transition-all duration-400 group-hover:text-black dark:group-hover:text-neutral-200">
        {title}
      </span>
    </button>
  );
}
