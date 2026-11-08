import { NextResponse } from "next/server";
import { readContentDoc, writeContentDoc } from "@/lib/admin/content-docs";
import { adminRoute } from "@/lib/admin/route-guard";
import { isContentDocName } from "@/lib/content-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ doc: string }> };

export const GET = adminRoute<Ctx>(async (_req, { params }) => {
  const { doc } = await params;
  if (!isContentDocName(doc)) {
    return NextResponse.json({ error: "Unknown document" }, { status: 404 });
  }
  return NextResponse.json({ data: await readContentDoc(doc) });
});

export const PUT = adminRoute<Ctx>(async (req, { params }) => {
  const { doc } = await params;
  if (!isContentDocName(doc)) {
    return NextResponse.json({ error: "Unknown document" }, { status: 404 });
  }
  const body = await req.json();
  return NextResponse.json(await writeContentDoc(doc, body?.data));
});
