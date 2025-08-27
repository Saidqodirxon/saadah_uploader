import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

const DB_KEY = "db.json";

type Item = {
  id: number;
  name: string;
  imageUrl: string;
  size: number;
  type: string;
  createdAt: string;
};

export async function POST(req: NextRequest) {
  try {
  const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const name = (form.get("name") as string | null)?.trim() || "";

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const safeName = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const key = `uploads/${Date.now()}-${safeName || "item"}.${ext}`;

    const contentType = file.type || undefined;
    const uploaded = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      token,
    });

  // read existing db.json if present
  let items: Item[] = [];
    try {
  const meta = await head(DB_KEY, { token });
      if (meta?.url) {
        const res = await fetch(meta.url, { cache: "no-store" });
        if (res.ok) {
          items = await res.json();
          if (!Array.isArray(items)) items = [];
        }
      }
    } catch {
      // first time: db.json may not exist
    }

    const row: Item = {
      id: Date.now(),
      name,
      imageUrl: uploaded.url,
      size: file.size,
      type: file.type,
      createdAt: new Date().toISOString(),
    };
    items.unshift(row);

    const dbPut = await put(DB_KEY, JSON.stringify(items, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token,
    });

    return NextResponse.json({
      ok: true,
      imageUrl: uploaded.url,
      jsonUrl: dbPut.url,
      item: row,
      total: items.length,
    });
  } catch (err) {
    const e = err as Error | undefined;
    return NextResponse.json(
      { error: e?.message || "upload failed" },
      { status: 500 }
    );
  }
}
