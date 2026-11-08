"use client";

import { useState } from "react";
import type { ContentDocMap, ContentDocName } from "@/lib/content-types";
import { adminFetch, savedMessage, useAdmin } from "./shared";

/** Local draft state for one JSON content document, with save/discard. */
export function useDocEditor<K extends ContentDocName>(
  doc: K,
  initial: ContentDocMap[K],
  label: string,
) {
  const { mode, notify } = useAdmin();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await adminFetch<{ data: ContentDocMap[K] }>(
        `/api/admin/content/${doc}`,
        { method: "PUT", json: { data: draft } },
      );
      setSaved(data);
      setDraft(data);
      notify("success", savedMessage(mode, label));
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return {
    draft,
    setDraft,
    dirty,
    saving,
    save,
    reset: () => setDraft(saved),
  };
}
