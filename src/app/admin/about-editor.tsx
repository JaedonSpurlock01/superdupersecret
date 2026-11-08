"use client";

import { Button } from "@/components/ui/button";
import type { AboutContent } from "@/lib/content-types";
import { ImageInput, moveItem, SaveBar, TextField } from "./shared";
import { useDocEditor } from "./use-doc-editor";

function ListControls({
  index,
  length,
  onMove,
  onRemove,
}: {
  index: number;
  length: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
      >
        ↑
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Move down"
        disabled={index === length - 1}
        onClick={() => onMove(index + 1)}
      >
        ↓
      </Button>
      <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

export function AboutEditor({ initial }: { initial: AboutContent }) {
  const { draft, setDraft, dirty, saving, save, reset } = useDocEditor(
    "about",
    initial,
    "About me",
  );

  const set = (patch: Partial<AboutContent>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const setParagraph = (i: number, value: string) =>
    set({ paragraphs: draft.paragraphs.map((p, j) => (j === i ? value : p)) });

  const setPhoto = (i: number, value: string) =>
    set({ photos: draft.photos.map((p, j) => (j === i ? value : p)) });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Home page summary</h2>
        <TextField
          label="Summary"
          multiline
          rows={4}
          value={draft.summary}
          onChange={(summary) => set({ summary })}
          hint="Shown in the ABOUT section on the home page."
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">/about paragraphs</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ paragraphs: [...draft.paragraphs, ""] })}
          >
            + Add paragraph
          </Button>
        </div>
        {draft.paragraphs.map((paragraph, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs have no stable id
            key={i}
            className="flex items-start gap-2"
          >
            <div className="flex-1">
              <TextField
                label={`Paragraph ${i + 1}`}
                multiline
                value={paragraph}
                onChange={(v) => setParagraph(i, v)}
              />
            </div>
            <div className="pt-5">
              <ListControls
                index={i}
                length={draft.paragraphs.length}
                onMove={(to) =>
                  set({ paragraphs: moveItem(draft.paragraphs, i, to) })
                }
                onRemove={() =>
                  set({
                    paragraphs: draft.paragraphs.filter((_, j) => j !== i),
                  })
                }
              />
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">/about photos</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set({ photos: [...draft.photos, ""] })}
          >
            + Add photo
          </Button>
        </div>
        {draft.photos.map((photo, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: photos may repeat
            key={i}
            className="flex items-start gap-2 rounded-md border border-border p-3"
          >
            <div className="flex-1">
              <ImageInput
                label={`Photo ${i + 1}`}
                folder="about"
                value={photo}
                onChange={(v) => setPhoto(i, v)}
                previewClassName="h-20 w-36 rounded-sm"
              />
            </div>
            <ListControls
              index={i}
              length={draft.photos.length}
              onMove={(to) => set({ photos: moveItem(draft.photos, i, to) })}
              onRemove={() =>
                set({ photos: draft.photos.filter((_, j) => j !== i) })
              }
            />
          </div>
        ))}
      </section>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}

export { ListControls };
