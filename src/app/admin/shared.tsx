"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StoreMode = "github" | "local" | "none";

export async function adminFetch<T>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers:
      json !== undefined
        ? { "Content-Type": "application/json", ...rest.headers }
        : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.reload();
  }
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Status toasts + local previews for freshly uploaded images
// ---------------------------------------------------------------------------

type Notice = { kind: "success" | "error"; message: string } | null;

type AdminCtx = {
  mode: StoreMode;
  notify: (kind: "success" | "error", message: string) => void;
  /** Maps an uploaded image URL to a local object URL until the site redeploys. */
  previews: Record<string, string>;
  addPreview: (url: string, objectUrl: string) => void;
};

const AdminContext = createContext<AdminCtx | null>(null);

export function useAdmin(): AdminCtx {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}

export function AdminProvider({
  mode,
  children,
}: {
  mode: StoreMode;
  children: ReactNode;
}) {
  const [notice, setNotice] = useState<Notice>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const notify = useCallback((kind: "success" | "error", message: string) => {
    setNotice({ kind, message });
    if (kind === "success") {
      window.setTimeout(
        () => setNotice((n) => (n?.message === message ? null : n)),
        6000,
      );
    }
  }, []);

  const addPreview = useCallback((url: string, objectUrl: string) => {
    setPreviews((p) => ({ ...p, [url]: objectUrl }));
  }, []);

  return (
    <AdminContext.Provider value={{ mode, notify, previews, addPreview }}>
      {children}
      {notice && (
        <output
          className={cn(
            "fixed bottom-4 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-start gap-3 rounded-md border px-4 py-2 text-xs shadow-lg",
            notice.kind === "success"
              ? "border-green-500/40 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
              : "border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
          )}
        >
          <span className="whitespace-pre-wrap">{notice.message}</span>
          <button
            type="button"
            className="opacity-60 hover:opacity-100"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </output>
      )}
    </AdminContext.Provider>
  );
}

export function savedMessage(mode: StoreMode, what: string): string {
  return mode === "github"
    ? `${what} committed. The site will update after the redeploy finishes (~1–2 min).`
    : `${what} saved to disk. Commit and push to publish.`;
}

// ---------------------------------------------------------------------------
// Form primitives
// ---------------------------------------------------------------------------

export const inputClass =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) =>
        multiline ? (
          <textarea
            id={id}
            className={cn(inputClass, "resize-y leading-relaxed")}
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={id}
            type={type}
            className={inputClass}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Field>
  );
}

/** Shows an image, preferring a local preview for not-yet-deployed uploads. */
export function PreviewImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const { previews } = useAdmin();
  const [failed, setFailed] = useState(false);
  const resolved = previews[src] ?? src;
  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-[10px] text-muted-foreground",
          className,
        )}
      >
        {src ? "Pending deploy" : "No image"}
      </div>
    );
  }
  return (
    // biome-ignore lint/performance/noImgElement: admin preview of arbitrary/blob URLs
    <img
      src={resolved}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

export function ImageInput({
  label,
  value,
  onChange,
  folder,
  previewClassName = "h-16 w-16 rounded-sm",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: "about" | "books" | "work" | "blog";
  previewClassName?: string;
}) {
  const { notify, addPreview, mode } = useAdmin();
  const [uploading, setUploading] = useState(false);
  const fileId = useId();

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", folder);
      const { url } = await adminFetch<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      addPreview(url, URL.createObjectURL(file));
      onChange(url);
      notify(
        "success",
        mode === "github"
          ? "Image uploaded. Remember to save this section so it's used."
          : "Image uploaded. Remember to save this section.",
      );
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label} hint="Paste a URL or upload an image (max 4MB).">
      {(id) => (
        <div className="flex items-start gap-3">
          <PreviewImage
            key={value}
            src={value}
            alt={label}
            className={cn("shrink-0 ring-1 ring-border/60", previewClassName)}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <input
              id={id}
              className={inputClass}
              value={value}
              placeholder="/uploads/… or https://…"
              onChange={(e) => onChange(e.target.value)}
            />
            <div>
              <input
                id={fileId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void upload(file);
                }}
              />
              <label
                htmlFor={fileId}
                className={cn(
                  "inline-flex h-6 cursor-pointer items-center rounded-md border border-border px-2 text-xs hover:bg-muted",
                  uploading && "pointer-events-none opacity-50",
                )}
              >
                {uploading ? "Uploading…" : "Upload image"}
              </label>
            </div>
          </div>
        </div>
      )}
    </Field>
  );
}

export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  disabled,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
      {dirty && (
        <span className="mr-auto text-xs text-muted-foreground">
          Unsaved changes
        </span>
      )}
      {onReset && (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={!dirty || saving}
          onClick={onReset}
        >
          Discard
        </Button>
      )}
      <Button
        type="button"
        size="lg"
        disabled={!dirty || saving || disabled}
        onClick={onSave}
      >
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
