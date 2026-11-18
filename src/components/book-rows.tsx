"use client";

import Image from "next/image";
import {
  BOOK_STATUS_LABEL,
  type Book,
  bookActivityTime,
} from "@/lib/book-utils";
import { cn } from "@/lib/utils";
import { BOOK_COVER_SIZES, useBookSpread } from "./book-spread";
import { HighlightList } from "./ui/highlight-list";

/** Home page book rows. Clicking one opens it as a spread (see BookSpread). */
export function BookRows({ books }: { books: Book[] }) {
  const spread = useBookSpread(books);

  return (
    <>
      <HighlightList className="flex flex-col gap-8">
        {books.map((book) => {
          const cover = spread.coverProps(book.id);
          return (
            <li key={book.id} className="group relative block">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="flex min-w-0 gap-4">
                  <div
                    className={cn(
                      "relative h-30 w-20 shrink-0 overflow-hidden rounded-sm bg-muted ring-1 ring-border/60 transition-transform duration-150 ease-(--ease-out) group-active:scale-[0.97]",
                      cover.className,
                    )}
                    style={cover.style}
                  >
                    <Image
                      src={book.image}
                      alt={`Cover: ${book.title}`}
                      fill
                      sizes={BOOK_COVER_SIZES}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="line-clamp-1 text-base font-semibold leading-6 tracking-tight underline decoration-transparent underline-offset-2 transition-colors duration-300 group-hover:decoration-foreground">
                      {book.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {book.author}
                    </p>
                    {book.summary && (
                      <p className="mt-1 line-clamp-2 text-base leading-6 text-muted-foreground">
                        {book.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 text-sm text-muted-foreground sm:items-end sm:text-right">
                  <span className="rounded-sm border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    {BOOK_STATUS_LABEL[book.status]}
                  </span>
                  <time
                    dateTime={new Date(bookActivityTime(book)).toISOString()}
                  >
                    {new Date(bookActivityTime(book)).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </time>
                </div>
              </div>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Open ${book.title}`}
                className="absolute -inset-x-3 -inset-y-2.5 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-ring"
                onClick={(event) => spread.open(book.id, event.currentTarget)}
              />
            </li>
          );
        })}
      </HighlightList>
      {spread.dialog}
    </>
  );
}
