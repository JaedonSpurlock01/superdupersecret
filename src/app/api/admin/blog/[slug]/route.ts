import { NextResponse } from "next/server";
import {
  assertSlug,
  deleteAdminBlog,
  getAdminBlog,
  saveAdminBlog,
} from "@/lib/admin/blog-admin";
import { adminRoute } from "@/lib/admin/route-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = adminRoute<Ctx>(async (_req, { params }) => {
  const slug = assertSlug((await params).slug);
  const post = await getAdminBlog(slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: post });
});

/** Update (and optionally rename) an existing post. */
export const PUT = adminRoute<Ctx>(async (req, { params }) => {
  const slug = assertSlug((await params).slug);
  const body = await req.json();
  return NextResponse.json(await saveAdminBlog(body?.data, slug));
});

export const DELETE = adminRoute<Ctx>(async (_req, { params }) => {
  const slug = assertSlug((await params).slug);
  return NextResponse.json(await deleteAdminBlog(slug));
});
