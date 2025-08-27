import { NextResponse } from "next/server";
import { head } from "@vercel/blob";

const DB_KEY = "db.json";

export async function GET() {
  try {
    type RawItem = Record<string, unknown>;

    const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;

    let items: RawItem[] = [];
    const meta = await head(DB_KEY, { token });
    let dbUrl: string | undefined;
    if (meta?.url) {
      dbUrl = meta.url;
      const res = await fetch(meta.url, { cache: "no-store" });
      if (res.ok) {
        const parsed = await res.json();
        if (Array.isArray(parsed)) items = parsed as RawItem[];
      }
    }

    // Normalize legacy shape (imageUrl -> url) and ensure consistent keys
    const normalized = items.map((it) => ({
      id: typeof it.id === "number" ? it.id : undefined,
      name: typeof it.name === "string" ? it.name : (typeof it.filename === "string" ? it.filename : undefined),
      pathname: typeof it.pathname === "string" ? it.pathname : undefined,
      url: typeof it.url === "string" ? it.url : (typeof it.imageUrl === "string" ? it.imageUrl : undefined),
      size: typeof it.size === "number" ? it.size : undefined,
      type: typeof it.type === "string" ? it.type : undefined,
      createdAt: typeof it.createdAt === "string" ? it.createdAt : undefined,
    }));

    return NextResponse.json({ ok: true, items: normalized, dbUrl });
  } catch {
    return NextResponse.json({ ok: true, items: [], dbUrl: undefined });
  }
}
