"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BOOK_STATUS_LABEL,
  type Book,
  type BookStatus,
} from "@/lib/book-utils";
import { cn } from "@/lib/utils";
import {
  Field,
  ImageInput,
  inputClass,
  PreviewImage,
  SaveBar,
  TextField,
} from "./shared";
import { useDocEditor } from "./use-doc-editor";

const STATUSES = Object.keys(BOOK_STATUS_LABEL) as BookStatus[];

function toDateInput(iso: string | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

function fromDateInput(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function BooksEditor({ initial }: { initial: Book[] }) {
  const { draft, setDraft, dirty, saving, save, reset } = useDocEditor(
    "books",
    initial,
    "Books",
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Book>) => {
    setDraft((books) =>
      books.map((b) =>
        b.id === id
          ? { ...b, ...patch, updatedAt: new Date().toISOString() }
          : b,
      ),
    );
  };

  const addBook = () => {
    const now = new Date().toISOString();
    const id = `book-${Date.now().toString(36)}`;
    setDraft((books) => [
      {
        id,
        title: "",
        author: "",
        image: "",
        status: "want_to_read",
        summary: "",
        addedAt: now,
        updatedAt: now,
      },
      ...books,
    ]);
    setOpenId(id);
  };

  const removeBook = (book: Book) => {
    if (!window.confirm(`Remove "${book.title || "Untitled"}"?`)) return;
    setDraft((books) => books.filter((b) => b.id !== book.id));
  };

  const hasIncomplete = draft.some(
    (b) => !b.title.trim() || !b.author.trim() || !b.image.trim(),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {draft.length} books · the home page shows the 3 most recently
          updated.
        </p>
        <Button type="button" variant="outline" size="lg" onClick={addBook}>
          + Add book
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {draft.map((book) => {
          const open = openId === book.id;
          return (
            <li key={book.id}>
              <div className="flex items-center gap-3 p-3">
                <PreviewImage
                  key={book.image}
                  src={book.image}
                  alt={book.title}
                  className="h-12 w-8 shrink-0 rounded-sm"
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setOpenId(open ? null : book.id)}
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      !book.title && "italic text-muted-foreground",
                    )}
                  >
                    {book.title || "Untitled book"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {book.author || "Unknown author"} ·{" "}
                    {BOOK_STATUS_LABEL[book.status]}
                  </p>
                </button>
                <select
                  aria-label="Status"
                  className={cn(inputClass, "w-auto py-1 text-xs")}
                  value={book.status}
                  onChange={(e) =>
                    update(book.id, { status: e.target.value as BookStatus })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {BOOK_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenId(open ? null : book.id)}
                >
                  {open ? "Close" : "Edit"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeBook(book)}
                >
                  Remove
                </Button>
              </div>

              {open && (
                <div className="grid gap-3 border-t border-border bg-muted/30 p-3 sm:grid-cols-2">
                  <TextField
                    label="Title"
                    value={book.title}
                    onChange={(title) => update(book.id, { title })}
                  />
                  <TextField
                    label="Author"
                    value={book.author}
                    onChange={(author) => update(book.id, { author })}
                  />
                  <div className="sm:col-span-2">
                    <ImageInput
                      label="Cover image"
                      folder="books"
                      value={book.image}
                      onChange={(image) => update(book.id, { image })}
                      previewClassName="h-20 w-[54px] rounded-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <TextField
                      label="Summary / notes"
                      multiline
                      value={book.summary ?? ""}
                      onChange={(summary) => update(book.id, { summary })}
                    />
                  </div>
                  <Field label="Added">
                    {(id) => (
                      <input
                        id={id}
                        type="date"
                        className={inputClass}
                        value={toDateInput(book.addedAt)}
                        onChange={(e) =>
                          update(book.id, {
                            addedAt:
                              fromDateInput(e.target.value) ?? book.addedAt,
                          })
                        }
                      />
                    )}
                  </Field>
                </div>
              )}
            </li>
          );
        })}
        {draft.length === 0 && (
          <li className="p-6 text-center text-xs text-muted-foreground">
            No books yet.
          </li>
        )}
      </ul>

      {hasIncomplete && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Every book needs a title, author, and cover image before saving.
        </p>
      )}

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={save}
        onReset={reset}
        disabled={hasIncomplete}
      />
    </div>
  );
}
