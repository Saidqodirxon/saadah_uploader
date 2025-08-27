import { NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // bir nechta fayl: <input name="files" multiple />
    const files = (form.getAll("files") as unknown) as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 });
    }

    // ixtiyoriy papka prefiksi (album, project va h.k.)
    const rawPrefix = (form.get("prefix") as string) || "uploads";
    const prefix = rawPrefix.replace(/^\/+|\/+$/g, ""); // old/oxirgi slashlarni tozalaymiz

    const allowOverwrite = form.get("overwrite") === "1";

    const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;

    const results: Array<{
      name: string;
      pathname: string;
      url: string;
      size: number;
      type: string;
    }> = [];

    for (const file of files) {
      const safeName = file.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .toLowerCase();

      const pathname = `${prefix}/${safeName}`;

      const blob = (await put(pathname, file, {
        access: "public",
        token,
        // Ko‘p marotaba yuklash uchun random suffix qo‘shamiz:
        addRandomSuffix: !allowOverwrite,
        // Agar eski faylni yangilamoqchi bo‘lsangiz, so‘rovda overwrite=1 yuboring:
        allowOverwrite,
        contentType: file.type || undefined,
      }) as { url?: string; pathname?: string });

      const finalPath = blob?.pathname || pathname;

      results.push({
        name: file.name,
        pathname: finalPath,
        url: blob?.url || "",
        size: file.size,
        type: file.type,
      });
    }

    // -- db.json yangilash: mavjud yozuvlarni o'qib, yangi yozuvlarni tepaga qo'shamiz
    type Item = {
      id: number;
      name: string;
      pathname: string;
      url: string;
      size: number;
      type: string;
      createdAt: string;
    };

    const DB_KEY = "db.json";
    let items: Item[] = [];
    try {
      const meta = await head(DB_KEY, { token });
      if (meta?.url) {
        const res = await fetch(meta.url, { cache: "no-store" });
        if (res.ok) {
          const parsed = await res.json();
          if (Array.isArray(parsed)) items = parsed;
        }
      }
    } catch {
      // ignore if db.json doesn't exist yet
    }

    const now = Date.now();
    const newRows: Item[] = results.map((r, idx) => ({
      id: now + idx,
      name: r.name,
      pathname: r.pathname,
      url: r.url,
      size: r.size,
      type: r.type,
      createdAt: new Date().toISOString(),
    }));

    // put new rows at the front
    items = [...newRows.reverse(), ...items];

    const dbPut = await put(DB_KEY, JSON.stringify(items, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token,
    });

  return NextResponse.json({ ok: true, count: results.length, items: newRows, total: items.length, dbUrl: dbPut.url });
  } catch (err) {
    const e = err as Error | undefined;
    return NextResponse.json({ ok: false, error: e?.message || "Upload failed" }, { status: 500 });
  }
}
