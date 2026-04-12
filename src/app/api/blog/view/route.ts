import { NextResponse } from "next/server";
import { isValidBlogSlug } from "@/lib/comments/slug";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug =
    typeof body === "object" &&
    body !== null &&
    "slug" in body &&
    typeof (body as { slug: unknown }).slug === "string"
      ? (body as { slug: string }).slug.trim()
      : "";

  if (!isValidBlogSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const row = await prisma.blogPostView.upsert({
      where: { postSlug: slug },
      create: { postSlug: slug, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    });
    return NextResponse.json({ viewCount: row.viewCount });
  } catch (err) {
    console.error("[POST /api/blog/view]", err);
    return NextResponse.json(
      { error: "Could not record view." },
      { status: 500 },
    );
  }
}
