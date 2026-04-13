import type { Book } from "./book-utils";
import { bookActivityTime } from "./book-utils";
import booksJson from "@/lib/data/books.json";

export type { Book, BookStatus } from "./book-utils";
export { BOOK_STATUS_LABEL, bookActivityTime } from "./book-utils";

function sortByLatestActivity(a: Book, b: Book): number {
  return bookActivityTime(b) - bookActivityTime(a);
}

const sortedBooks: Book[] = [...(booksJson as Book[])].sort(
  sortByLatestActivity,
);

export function getAllBooks(): Book[] {
  return [...sortedBooks];
}

export function getRecentBooks(limit: number): Book[] {
  return sortedBooks.slice(0, limit);
}
