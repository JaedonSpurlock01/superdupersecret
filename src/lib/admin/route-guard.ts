import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/content-types";
import { isAdminSession } from "./auth";
import { StoreError } from "./content-store";

/**
 * Rejects cross-origin mutations. The session cookie is SameSite=Strict, so
 * this is defense in depth.
 */
function isSameOrigin(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps an admin route: requires a valid session and maps errors to JSON. */
export function adminRoute<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Bad origin" }, { status: 403 });
    }
    if (!(await isAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      if (err instanceof StoreError) {
        console.error("[admin]", err.message);
        return NextResponse.json(
          { error: err.message },
          { status: err.status },
        );
      }
      console.error("[admin]", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Unexpected error" },
        { status: 500 },
      );
    }
  };
}
