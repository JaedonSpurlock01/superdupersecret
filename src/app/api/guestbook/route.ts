import { NextResponse } from "next/server";
import { isValidGuestbookDotId } from "@/lib/guestbook/dots";
import type { GuestbookEntryJson, GuestbookListJson } from "@/lib/guestbook/types";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const NAME_MAX = 80;
const MESSAGE_MAX = 8_000;
const DEVICE_ID_MIN = 8;
const DEVICE_ID_MAX = 128;
/** Cap list size to bound read cost and payload size (adjust if you need more). */
const LIST_MAX = 2000;

function toJson(row: {
  id: string;
  dotId: string;
  name: string;
  message: string;
  createdAt: Date;
}): GuestbookEntryJson {
  return {
    id: row.id,
    dotId: row.dotId,
    name: row.name,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  };
}

function isValidDeviceId(id: string): boolean {
  if (id.length < DEVICE_ID_MIN || id.length > DEVICE_ID_MAX) return false;
  return /^[a-zA-Z0-9\-_:]+$/.test(id);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId")?.trim() ?? "";

  try {
    const minePromise =
      deviceId && isValidDeviceId(deviceId)
        ? prisma.guestbookEntry.findUnique({
            where: { deviceId },
            select: {
              id: true,
              dotId: true,
              name: true,
              message: true,
              createdAt: true,
            },
          })
        : Promise.resolve(null);

    const [rows, mineRow] = await Promise.all([
      prisma.guestbookEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: LIST_MAX,
        select: {
          id: true,
          dotId: true,
          name: true,
          message: true,
          createdAt: true,
        },
      }),
      minePromise,
    ]);

    const mine: GuestbookEntryJson | null = mineRow ? toJson(mineRow) : null;

    const body: GuestbookListJson = {
      entries: rows.map(toJson),
      mine,
    };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[GET /api/guestbook]", err);
    const dev = process.env.NODE_ENV === "development";
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Could not load guestbook entries.",
        ...(dev ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const deviceId =
    typeof o.deviceId === "string" ? o.deviceId.trim() : "";
  const dotId = typeof o.dotId === "string" ? o.dotId.trim() : "";
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";

  if (!isValidDeviceId(deviceId)) {
    return NextResponse.json({ error: "Invalid device id" }, { status: 400 });
  }

  if (!isValidGuestbookDotId(dotId)) {
    return NextResponse.json({ error: "Invalid map location" }, { status: 400 });
  }

  if (name.length < 1 || name.length > NAME_MAX) {
    return NextResponse.json(
      { error: `Name must be 1–${NAME_MAX} characters` },
      { status: 400 },
    );
  }

  if (message.length < 1 || message.length > MESSAGE_MAX) {
    return NextResponse.json(
      { error: `Message must be 1–${MESSAGE_MAX} characters` },
      { status: 400 },
    );
  }

  try {
    const saved = await prisma.guestbookEntry.upsert({
      where: { deviceId },
      create: {
        deviceId,
        dotId,
        name,
        message,
      },
      update: {
        dotId,
        name,
        message,
      },
      select: {
        id: true,
        dotId: true,
        name: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ entry: toJson(saved) });
  } catch (err) {
    console.error("[POST /api/guestbook]", err);
    const dev = process.env.NODE_ENV === "development";
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Could not save guestbook entry.",
        ...(dev ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId")?.trim() ?? "";

  if (!isValidDeviceId(deviceId)) {
    return NextResponse.json({ error: "Invalid device id" }, { status: 400 });
  }

  try {
    await prisma.guestbookEntry.deleteMany({ where: { deviceId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/guestbook]", err);
    const dev = process.env.NODE_ENV === "development";
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Could not delete guestbook entry.",
        ...(dev ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}
