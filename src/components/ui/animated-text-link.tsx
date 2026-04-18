"use client";

import { ArrowLeft, ArrowRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimatedTextLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  arrowSide?: "left" | "right";
  noArrow?: boolean;
};

export function AnimatedTextLink({
  href,
  children,
  className,
  arrowSide = "right",
  noArrow = false,
}: AnimatedTextLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-neutral-500 dark:text-neutral-400 group inline-flex items-center gap-1 transition-all duration-300 relative",
        className,
      )}
    >
      {arrowSide === "left" && !noArrow && (
        <HugeiconsIcon
          icon={ArrowLeft}
          className="size-3.5 group-hover:-translate-x-0.5 group-hover:text-black dark:group-hover:text-neutral-200 transition-all duration-400"
        />
      )}
      <span className="group-hover:text-black dark:group-hover:text-neutral-200 transition-all duration-400">
        {children}
      </span>
      {arrowSide === "right" && !noArrow && (
        <HugeiconsIcon
          icon={ArrowRight}
          className="size-3.5 group-hover:translate-x-0.5 group-hover:text-black dark:group-hover:text-neutral-200 transition-all duration-400"
        />
      )}
      <span
        className={cn(
          "absolute -bottom-1 w-0 h-px bg-black dark:bg-neutral-200 group-hover:w-[calc(100%-1.2rem)] transition-all duration-400",
          !noArrow && arrowSide === "right" ? "left-0" : "right-0",
        )}
      />
    </Link>
  );
}
