import type { Book, BookStatus } from "@/lib/book-utils";

export type WorkItem = {
  company: string;
  position: string;
  location: string;
  date: string;
  imageSrc: string;
  href: string;
  description: string;
  skills: string[];
};

export type AboutContent = {
  /** Short blurb shown in the ABOUT section on the home page. */
  summary: string;
  /** Paragraphs shown on the /about page. */
  paragraphs: string[];
  /** Image paths/URLs shown on the /about page. */
  photos: string[];
};

/** Editable JSON documents and where they live in the repo. */
export const CONTENT_DOCS = {
  books: "src/lib/data/books.json",
  about: "src/lib/data/about.json",
  work: "src/lib/data/work.json",
} as const;

export type ContentDocName = keyof typeof CONTENT_DOCS;

export type ContentDocMap = {
  books: Book[];
  about: AboutContent;
  work: WorkItem[];
};

const BOOK_STATUSES: BookStatus[] = ["reading", "finished", "want_to_read"];

class ValidationError extends Error {}
export { ValidationError };

function str(value: unknown, field: string, { required = true } = {}): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} is required`);
  return trimmed;
}

function strArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array`);
  }
  // Blank entries (e.g. an empty paragraph or trailing comma) are dropped.
  return value
    .map((v, i) => str(v, `${field}[${i}]`, { required: false }))
    .filter(Boolean);
}

function isoDate(value: unknown, field: string): string {
  const s = str(value, field);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError(`${field} must be a valid date`);
  }
  return d.toISOString();
}

function validateBooks(value: unknown): Book[] {
  if (!Array.isArray(value))
    throw new ValidationError("books must be an array");
  const ids = new Set<string>();
  return value.map((raw, i) => {
    const b = (raw ?? {}) as Record<string, unknown>;
    const id = str(b.id, `books[${i}].id`);
    if (ids.has(id)) throw new ValidationError(`Duplicate book id "${id}"`);
    ids.add(id);
    const status = b.status as BookStatus;
    if (!BOOK_STATUSES.includes(status)) {
      throw new ValidationError(`books[${i}].status is invalid`);
    }
    const book: Book = {
      id,
      title: str(b.title, `books[${i}].title`),
      author: str(b.author, `books[${i}].author`),
      image: str(b.image, `books[${i}].image`),
      status,
      summary: str(b.summary ?? "", `books[${i}].summary`, { required: false }),
      addedAt: isoDate(b.addedAt, `books[${i}].addedAt`),
    };
    if (b.updatedAt)
      book.updatedAt = isoDate(b.updatedAt, `books[${i}].updatedAt`);
    return book;
  });
}

function validateAbout(value: unknown): AboutContent {
  const a = (value ?? {}) as Record<string, unknown>;
  return {
    summary: str(a.summary, "summary"),
    paragraphs: strArray(a.paragraphs, "paragraphs"),
    photos: strArray(a.photos, "photos"),
  };
}

function validateWork(value: unknown): WorkItem[] {
  if (!Array.isArray(value)) throw new ValidationError("work must be an array");
  return value.map((raw, i) => {
    const w = (raw ?? {}) as Record<string, unknown>;
    return {
      company: str(w.company, `work[${i}].company`),
      position: str(w.position, `work[${i}].position`),
      location: str(w.location, `work[${i}].location`),
      date: str(w.date, `work[${i}].date`),
      imageSrc: str(w.imageSrc, `work[${i}].imageSrc`),
      href: str(w.href, `work[${i}].href`),
      description: str(w.description, `work[${i}].description`),
      skills: strArray(w.skills ?? [], `work[${i}].skills`),
    };
  });
}

export const CONTENT_VALIDATORS: {
  [K in ContentDocName]: (value: unknown) => ContentDocMap[K];
} = {
  books: validateBooks,
  about: validateAbout,
  work: validateWork,
};

export function isContentDocName(name: string): name is ContentDocName {
  return Object.hasOwn(CONTENT_DOCS, name);
}
