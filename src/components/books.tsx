import { getRecentBooks } from "@/lib/books";
import { BookRows } from "./book-rows";
import Section from "./section";
import { AnimatedTextLink } from "./ui/animated-text-link";

export default function Books() {
  const books = getRecentBooks(3);

  return (
    <Section title="BOOKS">
      <div className="relative mt-8 space-y-4">
        <BookRows books={books} />

        <div className="pt-2 text-sm">
          <AnimatedTextLink href="/books">More books</AnimatedTextLink>
        </div>
      </div>
    </Section>
  );
}
