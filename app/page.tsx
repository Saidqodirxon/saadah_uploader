"use client";

import { useState } from "react";
// Image not needed in this page

type UploadedItem = {
  name: string;
  pathname: string;
  url: string;
  size: number;
  type: string;
};

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [prefix, setPrefix] = useState("uploads");
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!files || files.length === 0) return;

    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    form.append("prefix", prefix);
    if (overwrite) form.append("overwrite", "1");

    setLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed");
      setItems(data.items);
    } catch (err) {
      const e = err as Error | undefined;
      setError(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: 16 }}>
      <h1>Yuklash</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Papka (prefix):
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="uploads/bookloop"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Fayllar:
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
          />
          Bir xil nom bo‘lsa ustidan yozish (overwrite)
        </label>

        <button disabled={loading} type="submit" style={{ padding: "10px 14px" }}>
          {loading ? "Yuklanmoqda..." : "Yuklash"}
        </button>
      </form>

      {error && (
        <p style={{ color: "crimson", marginTop: 12 }}>
          Xato: {error}
        </p>
      )}

      {items.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>Natijalar ({items.length} ta)</h2>
          <ul style={{ display: "grid", gap: 10, paddingLeft: 18 }}>
            {items.map((it) => (
              <li key={it.url}>
                <a href={it.url} target="_blank" rel="noreferrer">{it.name}</a>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {it.type} • {(it.size / 1024).toFixed(1)}KB • {it.pathname}
                </div>
              </li>
            ))}
          </ul>

          <h3 style={{ marginTop: 16 }}>JSON</h3>
          <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(items, null, 2)}
          </pre>
        </>
      )}
    </main>
  );
}

