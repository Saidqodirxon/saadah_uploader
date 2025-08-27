import { NextResponse } from "next/server";
import { head } from "@vercel/blob";

const DB_KEY = "db.json";

export async function GET() {
  try {
    type Item = {
      id: number;
      name: string;
      imageUrl: string;
      size: number;
      type: string;
      createdAt: string;
    };

    let items: Item[] = [];
    const meta = await head(DB_KEY);
    if (meta?.url) {
      const res = await fetch(meta.url, { cache: "no-store" });
      if (res.ok) {
        items = await res.json();
        if (!Array.isArray(items)) items = [];
      }
    }
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
