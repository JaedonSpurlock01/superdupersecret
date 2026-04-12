import { getAllBooks } from "@/lib/books";
import { BooksClient } from "./books-client";

export const metadata = {
  title: "Books",
  description: "Books I am reading, have finished, or want to read.",
};

export default function BooksPage() {
  const books = getAllBooks();

  return <BooksClient books={books} />;
}
