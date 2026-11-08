import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkLoginRateLimit,
  clearLoginRateLimit,
  createSessionToken,
  isAdminEnabled,
  verifyPassword,
} from "@/lib/admin/auth";

export const runtime = "nodejs";

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = clientIp(req);
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = createSessionToken();
  if (!session) {
    return NextResponse.json(
      { error: "AUTH_SECRET is not configured" },
      { status: 500 },
    );
  }

  clearLoginRateLimit(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
