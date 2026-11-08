import { NextResponse } from "next/server";
import { listAdminBlogs, saveAdminBlog } from "@/lib/admin/blog-admin";
import { adminRoute } from "@/lib/admin/route-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = adminRoute(async () =>
  NextResponse.json({ data: await listAdminBlogs() }),
);

/** Create a new post. */
export const POST = adminRoute(async (req) => {
  const body = await req.json();
  return NextResponse.json(await saveAdminBlog(body?.data, null));
});
