export type BookStatus = "reading" | "finished" | "want_to_read";

export type Book = {
  id: string;
  title: string;
  author: string;
  image: string;
  status: BookStatus;
  summary?: string;
  addedAt: string;
  updatedAt?: string;
};

export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  reading: "Reading",
  finished: "Finished",
  want_to_read: "Want to read",
};

export function bookActivityTime(book: Book): number {
  const added = new Date(book.addedAt).getTime();
  const updated = book.updatedAt ? new Date(book.updatedAt).getTime() : 0;
  return Math.max(added, updated);
}
