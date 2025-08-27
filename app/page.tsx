"use client";

import { useEffect, useState } from "react";

type Item = {
  id: number;
  name: string;
  imageUrl: string;
  size: number;
  type: string;
  createdAt: string;
};

export default function Page() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [jsonUrl, setJsonUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshDb() {
    const res = await fetch("/api/db", { cache: "no-store" });
    const data = await res.json();
    if (data?.items) setItems(data.items);
  }

  useEffect(() => {
    refreshDb();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Iltimos, rasm tanlang.");
      return;
    }
    if (!name.trim()) {
      setError("Iltimos, nom kiriting.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("name", name);
      fd.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Yuklashda xatolik");
      } else {
        setImageUrl(data.imageUrl);
        setJsonUrl(data.jsonUrl);
        setName("");
        setFile(null);
        await refreshDb();
      }
    } catch (err: any) {
      setError(err?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 16 }}>Vercel Blob — Rasm yuklash + JSON saqlash</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <label>
          Nom (name):
          <input
            type="text"
            placeholder="Kitob nomi, foydalanuvchi ismi va h.k."
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Rasm (file):
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            cursor: loading ? "not-allowed" : "pointer",
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            border: "none"
          }}
        >
          {loading ? "Yuklanmoqda..." : "Yuklash"}
        </button>

        {error && <p style={{ color: "red", marginTop: 4 }}>{error}</p>}
      </form>

      {imageUrl && (
        <div style={{ marginBottom: 20 }}>
          <h3>Yuklangan rasm URL:</h3>
          <a href={imageUrl} target="_blank" rel="noreferrer">{imageUrl}</a>
          <div style={{ marginTop: 8 }}>
            {/* preview */}
            <img src={imageUrl} alt="Uploaded" style={{ maxWidth: 300, borderRadius: 8 }} />
          </div>
        </div>
      )}

      {jsonUrl && (
        <div style={{ marginBottom: 20 }}>
          <h3>db.json URL:</h3>
          <a href={jsonUrl} target="_blank" rel="noreferrer">{jsonUrl}</a>
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2>Saqlangan yozuvlar (db.json):</h2>
        {items.length === 0 ? (
          <p>Hozircha yozuv yo‘q.</p>
        ) : (
          <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none", marginTop: 12 }}>
            {items.map((it) => (
              <li key={it.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img src={it.imageUrl} alt={it.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {new Date(it.createdAt).toLocaleString()} — {Math.round(it.size / 1024)} KB
                    </div>
                    <a href={it.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                      Open image
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
