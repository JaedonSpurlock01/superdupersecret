"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  type Book,
  type BookStatus,
  BOOK_STATUS_LABEL,
  bookActivityTime,
} from "@/lib/book-utils";
import { Button } from "@/components/ui/button";
import { StaggerContainer } from "@/components/stagger-container";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";
import { cn } from "@/lib/utils";

type FilterKey = "all" | BookStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reading", label: BOOK_STATUS_LABEL.reading },
  { key: "finished", label: BOOK_STATUS_LABEL.finished },
  { key: "want_to_read", label: BOOK_STATUS_LABEL.want_to_read },
];

export function BooksClient({ books }: { books: Book[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(() => {
    if (filter === "all") return books;
    return books.filter((b) => b.status === filter);
  }, [books, filter]);

  return (
    <div className="min-h-screen px-4 lg:px-0 grid grid-cols-1 md:grid-cols-5 gap-20 pt-20 pb-20 max-w-4xl mx-auto">
      <StaggerContainer className="h-fit md:sticky md:top-6 md:col-span-2" delayStep={100}>
        <AnimatedTextLink href="/" arrowSide="left">
          Books
        </AnimatedTextLink>

        <p className="leading-relaxed text-xs text-neutral-700 dark:text-neutral-300 mt-2">
          These are books I have read, am reading, or want to read. They consist of philosophy, software engineering, and historical classics.
        </p>

        <div
          className="mt-8 flex flex-row flex-wrap gap-1.5"
          role="tablist"
          aria-label="Filter by reading status"
        >
          {FILTERS.map(({ key, label }) => {
            const isActive = filter === key;
            return (
              <Button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-fit justify-start h-auto min-h-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide shadow-none",
                  isActive
                    ? [
                        // Light: selected state stays clearly distinct from badge-style inactive
                        "border-neutral-500/60 bg-neutral-300 text-neutral-950 hover:bg-neutral-300/80",
                        // Dark: unchanged from previous secondary Button
                        "dark:border-transparent dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80",
                      ]
                    : [
                        // Light: match Skills badges + book status pills on home (neutral-200 / border-border/40)
                        "border-border/40 bg-neutral-200 text-neutral-700 hover:bg-neutral-300/80 hover:text-neutral-900",
                        // Dark: unchanged from previous outline + custom inactive classes
                        "dark:border-border/80 dark:bg-transparent dark:text-muted-foreground dark:hover:!bg-transparent dark:hover:text-foreground",
                      ],
                )}
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </StaggerContainer>

      <StaggerContainer className="flex flex-col gap-4 md:col-span-3 md:pl-20" delayStep={100}>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">No books in this list yet.</p>
        ) : (
          <ul className="flex flex-col gap-10">
            {visible.map((book) => (
              <li key={book.id}>
                <article className="group flex flex-col gap-4 sm:flex-row sm:gap-6">
                  <div className="relative mx-auto h-40 w-[calc(10rem*2/3)] shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border/60 sm:mx-0">
                    <Image
                      src={book.image}
                      alt={`Cover: ${book.title}`}
                      fill
                      sizes="107px"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <h2 className="line-clamp-2 text-base font-medium tracking-tight underline decoration-transparent underline-offset-2 transition-colors duration-300 group-hover:decoration-foreground">
                          {book.title}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">{book.author}</p>
                        {book.summary && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {book.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 text-xs text-muted-foreground sm:items-end sm:text-right">
                        <span className="w-fit rounded-sm border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                          {BOOK_STATUS_LABEL[book.status]}
                        </span>
                        <time dateTime={new Date(bookActivityTime(book)).toISOString()}>
                          Updated{" "}
                          {new Date(bookActivityTime(book)).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </StaggerContainer>
    </div>
  );
}
