import Image from "next/image";
import { BOOK_STATUS_LABEL, bookActivityTime } from "@/lib/book-utils";
import { getRecentBooks } from "@/lib/books";
import Section from "./section";
import { AnimatedTextLink } from "./ui/animated-text-link";

export default function Books() {
  const books = getRecentBooks(3);

  return (
    <Section title="BOOKS">
      <div className="relative mt-8 space-y-4">
        <ul className="flex flex-col gap-8">
          {books.map((book) => (
            <li key={book.id} className="group block">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="flex min-w-0 gap-3">
                  <div className="relative h-20 w-[calc(5rem*2/3)] shrink-0 overflow-hidden rounded-sm bg-muted ring-1 ring-border/60">
                    <Image
                      src={book.image}
                      alt={`Cover: ${book.title}`}
                      fill
                      sizes="54px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="line-clamp-1 text-sm font-semibold leading-tight tracking-tight underline decoration-transparent underline-offset-2 transition-colors duration-300 group-hover:decoration-foreground">
                      {book.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {book.author}
                    </p>
                    {book.summary && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {book.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-muted-foreground sm:items-end sm:text-right">
                  <span className="rounded-sm border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    {BOOK_STATUS_LABEL[book.status]}
                  </span>
                  <time
                    dateTime={new Date(bookActivityTime(book)).toISOString()}
                  >
                    {new Date(bookActivityTime(book)).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-2 text-xs">
          <AnimatedTextLink href="/books">More books</AnimatedTextLink>
        </div>
      </div>
    </Section>
  );
}
