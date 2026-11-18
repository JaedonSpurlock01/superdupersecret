"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { work } from "@/lib/data/work";

/**
 * A company from work.json as an inline link inside running text: logo tile,
 * dotted underline, and the most recent role and dates in a tooltip.
 */
export function InlineCompany({ name }: { name: string }) {
  const latest = work.find((item) => item.company === name);
  if (!latest) return <>{name}</>;
  const external = latest.href.startsWith("http");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={latest.href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="group whitespace-nowrap text-foreground underline decoration-neutral-400 decoration-dotted underline-offset-4 transition-colors duration-200 hover:decoration-foreground"
          >
            <span className="relative mr-1.5 inline-block size-[1.125em] overflow-hidden rounded-[4px] bg-black align-[-0.2em] ring-1 ring-white/10 transition-[scale,rotate] duration-300 ease-(--ease-pop) group-hover:-rotate-6 group-hover:scale-115 motion-reduce:transition-none">
              <Image
                src={latest.imageSrc}
                alt=""
                fill
                sizes="18px"
                className={
                  latest.imageSrc.endsWith(".png")
                    ? "object-contain p-px"
                    : "object-cover"
                }
              />
            </span>
            {name}
          </Link>
        }
      />
      <TooltipContent>
        {latest.position} · {latest.date}
      </TooltipContent>
    </Tooltip>
  );
}
