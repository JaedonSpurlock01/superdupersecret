import {
  CONTENT_DOCS,
  CONTENT_VALIDATORS,
  type ContentDocMap,
  type ContentDocName,
} from "@/lib/content-types";
import { commitRepoFiles, readRepoFile, StoreError } from "./content-store";

export async function readContentDoc<K extends ContentDocName>(
  name: K,
): Promise<ContentDocMap[K]> {
  const raw = await readRepoFile(CONTENT_DOCS[name]);
  if (raw == null) throw new StoreError(`${CONTENT_DOCS[name]} not found`, 404);
  return JSON.parse(raw) as ContentDocMap[K];
}

export async function writeContentDoc<K extends ContentDocName>(
  name: K,
  value: unknown,
) {
  const validated = CONTENT_VALIDATORS[name](value);
  const result = await commitRepoFiles(
    [
      {
        path: CONTENT_DOCS[name],
        content: `${JSON.stringify(validated, null, 2)}\n`,
      },
    ],
    `content(${name}): update via admin`,
  );
  return { data: validated, ...result };
}
