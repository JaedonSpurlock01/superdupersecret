import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Database-free admin auth: a single password from `ADMIN_PASSWORD`, and a
 * stateless HMAC-signed session cookie. Changing the password (or AUTH_SECRET)
 * invalidates every existing session.
 */

export const ADMIN_COOKIE = "__admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD?.trim();
  return pw ? pw : null;
}

export function isAdminEnabled(): boolean {
  return adminPassword() !== null;
}

function signingKey(): string | null {
  const pw = adminPassword();
  if (!pw) return null;
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev-admin-secret" : "");
  if (!secret) return null;
  return `${secret}:${pw}`;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash both sides so lengths match and comparison is constant-time.
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function verifyPassword(candidate: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  return safeEqual(candidate, pw);
}

export function createSessionToken(): { token: string; maxAge: number } | null {
  const key = signingKey();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${exp}`;
  return {
    token: `${payload}.${sign(payload, key)}`,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function isValidSessionToken(token: string | undefined): boolean {
  const key = signingKey();
  if (!key || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  return safeEqual(parts[2], sign(`${parts[0]}.${parts[1]}`, key));
}

export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(ADMIN_COOKIE)?.value);
}

// Simple in-memory login throttle (per server instance). Good enough to slow
// down casual brute force; use a strong password regardless.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

export function clearLoginRateLimit(ip: string): void {
  attempts.delete(ip);
}
