import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { commitRepoFiles } from "@/lib/admin/content-store";
import { adminRoute } from "@/lib/admin/route-guard";

export const runtime = "nodejs";

// Vercel caps request bodies at ~4.5MB; keep uploads under that.
const MAX_BYTES = 4 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const FOLDERS = new Set(["about", "books", "work", "blog"]);

function safeBaseName(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

/**
 * Uploads an image into `public/uploads/<folder>/` and returns its public URL.
 * In GitHub mode this is its own commit, so the image is live after the next
 * deploy; save the referencing content afterwards.
 */
export const POST = adminRoute(async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "about");
  const folder = FOLDERS.has(folderRaw) ? folderRaw : "about";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const ext = EXTENSIONS[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF, or AVIF images are allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 4MB or smaller" },
      { status: 400 },
    );
  }

  const name = `${safeBaseName(file.name)}-${randomBytes(4).toString("hex")}.${ext}`;
  const repoPath = `public/uploads/${folder}/${name}`;
  const content = Buffer.from(await file.arrayBuffer()).toString("base64");

  const result = await commitRepoFiles(
    [{ path: repoPath, content, encoding: "base64" }],
    `content(upload): add ${folder}/${name} via admin`,
  );

  return NextResponse.json({ url: `/uploads/${folder}/${name}`, ...result });
});
