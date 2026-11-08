"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WorkItem } from "@/lib/content-types";
import { ListControls } from "./about-editor";
import {
  ImageInput,
  moveItem,
  PreviewImage,
  SaveBar,
  TextField,
} from "./shared";
import { useDocEditor } from "./use-doc-editor";

const EMPTY: WorkItem = {
  company: "",
  position: "",
  location: "",
  date: "",
  imageSrc: "",
  href: "",
  description: "",
  skills: [],
};

export function WorkEditor({ initial }: { initial: WorkItem[] }) {
  const { draft, setDraft, dirty, saving, save, reset } = useDocEditor(
    "work",
    initial,
    "Experience",
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const update = (i: number, patch: Partial<WorkItem>) =>
    setDraft((items) =>
      items.map((item, j) => (j === i ? { ...item, ...patch } : item)),
    );

  const hasIncomplete = draft.some(
    (w) =>
      !w.company.trim() ||
      !w.position.trim() ||
      !w.location.trim() ||
      !w.date.trim() ||
      !w.imageSrc.trim() ||
      !w.href.trim() ||
      !w.description.trim(),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Shown top to bottom on the home page. Dates containing “Present” get
          the green pulse.
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            setDraft((items) => [{ ...EMPTY }, ...items]);
            setOpenIndex(0);
          }}
        >
          + Add experience
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {draft.map((item, i) => {
          const open = openIndex === i;
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: entries have no stable id and can repeat company/date
              key={i}
            >
              <div className="flex items-center gap-3 p-3">
                <PreviewImage
                  key={item.imageSrc}
                  src={item.imageSrc}
                  alt={item.company}
                  className="size-9 shrink-0 rounded-sm"
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <p className="truncate text-sm font-medium">
                    {item.position || "New position"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.company || "Company"} · {item.date || "Dates"}
                  </p>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  {open ? "Close" : "Edit"}
                </Button>
                <ListControls
                  index={i}
                  length={draft.length}
                  onMove={(to) => {
                    setDraft((items) => moveItem(items, i, to));
                    if (open) setOpenIndex(to);
                  }}
                  onRemove={() => {
                    if (
                      !window.confirm(
                        `Remove "${item.position || "this experience"}"?`,
                      )
                    )
                      return;
                    setDraft((items) => items.filter((_, j) => j !== i));
                    setOpenIndex(null);
                  }}
                />
              </div>

              {open && (
                <div className="grid gap-3 border-t border-border bg-muted/30 p-3 sm:grid-cols-2">
                  <TextField
                    label="Position"
                    value={item.position}
                    onChange={(position) => update(i, { position })}
                  />
                  <TextField
                    label="Company"
                    value={item.company}
                    onChange={(company) => update(i, { company })}
                  />
                  <TextField
                    label="Location"
                    value={item.location}
                    onChange={(location) => update(i, { location })}
                  />
                  <TextField
                    label="Dates"
                    value={item.date}
                    placeholder="May 2025 - Present"
                    onChange={(date) => update(i, { date })}
                  />
                  <div className="sm:col-span-2">
                    <TextField
                      label="Link"
                      value={item.href}
                      placeholder="https://… or /internal-page"
                      onChange={(href) => update(i, { href })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <ImageInput
                      label="Logo"
                      folder="work"
                      value={item.imageSrc}
                      onChange={(imageSrc) => update(i, { imageSrc })}
                      previewClassName="size-12 rounded-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <TextField
                      label="Description"
                      multiline
                      value={item.description}
                      onChange={(description) => update(i, { description })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <TextField
                      label="Skills"
                      value={item.skills.join(", ")}
                      hint="Comma-separated"
                      onChange={(v) =>
                        update(i, {
                          skills: v.split(",").map((s) => s.trimStart()),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {hasIncomplete && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Every experience needs all fields filled in before saving.
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
