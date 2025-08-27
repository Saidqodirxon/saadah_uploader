"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type UploadedItem = {
  id?: number;
  name: string;
  pathname: string;
  url: string;
  size: number;
  type: string;
  createdAt?: string;
};

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [prefix, setPrefix] = useState("uploads");
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [dbUrl, setDbUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshDb() {
    try {
      const res = await fetch("/api/db", { cache: "no-store" });
      const data = await res.json();
      if (data?.items && Array.isArray(data.items)) {
        setItems(data.items as UploadedItem[]);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshDb();
  }, []);

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
      // uploaded ok: refresh full DB and capture dbUrl if returned
      if (data.dbUrl) setDbUrl(data.dbUrl);
      await refreshDb();
  // clear selection
  setFiles(null);
  const fileInput = document.querySelector('input[type=file]') as HTMLInputElement | null;
  if (fileInput) fileInput.value = '';
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

      <div style={{ marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Galereya ({items.length})</h2>
          {dbUrl && (
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              db.json: <a href={dbUrl} target="_blank" rel="noreferrer">{dbUrl}</a>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p style={{ marginTop: 12 }}>Hozircha yozuv yo‘q.</p>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {items.map((it) => (
              <div key={it.pathname} style={{ border: "1px solid #e6e6e6", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                <a href={it.url} target="_blank" rel="noreferrer" style={{ display: "block", width: "100%", height: 140, position: "relative" }}>
                  <Image src={it.url} alt={it.name} fill style={{ objectFit: "cover" }} unoptimized />
                </a>
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                    {it.createdAt ? new Date(it.createdAt).toLocaleString() + " — " : ""}{Math.round(it.size / 1024)} KB
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <a href={it.url} target="_blank" rel="noreferrer">Open</a> • <span style={{ color: "#444" }}>{it.pathname}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ marginTop: 16 }}>Raw JSON</h3>
        <pre style={{ background: "#0f172a", color: "#d1fae5", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(items, null, 2)}
        </pre>
      </div>
    </main>
  );
}

