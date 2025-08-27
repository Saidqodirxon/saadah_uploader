import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

const DB_KEY = "db.json";

export async function POST(req: NextRequest) {
  try {
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

    const uploaded = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: (file as any).type || undefined,
    });

    // read existing db.json if present
    let items: any[] = [];
    try {
      const meta = await head(DB_KEY);
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

    const row = {
      id: Date.now(),
      name,
      imageUrl: uploaded.url,
      size: (file as any).size,
      type: (file as any).type,
      createdAt: new Date().toISOString(),
    };
    items.unshift(row);

    const dbPut = await put(DB_KEY, JSON.stringify(items, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    return NextResponse.json({
      ok: true,
      imageUrl: uploaded.url,
      jsonUrl: dbPut.url,
      item: row,
      total: items.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "upload failed" },
      { status: 500 }
    );
  }
}
