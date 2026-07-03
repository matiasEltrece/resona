"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteConfig, FontPreset } from "@/lib/site-config";

function LogoField({
  label,
  currentUrl,
  fallback,
  name,
}: {
  label: string;
  currentUrl: string | null;
  fallback: string;
  name: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>
      <div className="flex items-center gap-4">
        <div className="glass rounded-xl p-3 flex items-center justify-center" style={{ width: 160, height: 70 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview ?? currentUrl ?? fallback} alt={label} style={{ maxWidth: "100%", maxHeight: 44, width: "auto", height: "auto" }} />
        </div>
        <input
          type="file"
          name={name}
          accept="image/png,image/webp,image/svg+xml"
          className="text-xs text-muted"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }}
        />
      </div>
      <p className="text-xs text-muted/70">PNG, WebP o SVG · máx. 2MB. Dejalo vacío para no cambiarlo.</p>
    </div>
  );
}

export default function BrandingForm({ initial, fontPresets }: { initial: SiteConfig; fontPresets: Record<string, FontPreset> }) {
  const router = useRouter();
  const [accentFrom, setAccentFrom] = useState(initial.accentFrom);
  const [accentVia, setAccentVia] = useState(initial.accentVia);
  const [accentTo, setAccentTo] = useState(initial.accentTo);
  const [fontPreset, setFontPreset] = useState(initial.fontPreset);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    form.set("accent_from", accentFrom);
    form.set("accent_via", accentVia);
    form.set("accent_to", accentTo);
    form.set("font_preset", fontPreset);
    try {
      const res = await fetch("/api/admin/site-config", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setMessage({ type: "ok", text: "Guardado. Los cambios ya están en vivo." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Color de marca (degradé dorado)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Desde", value: accentFrom, set: setAccentFrom },
            { label: "Medio", value: accentVia, set: setAccentVia },
            { label: "Hasta (sólido)", value: accentTo, set: setAccentTo },
          ].map((c) => (
            <div key={c.label} className="space-y-1">
              <label className="text-xs text-muted block">{c.label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={c.value} onChange={(e) => c.set(e.target.value)} className="w-9 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => c.set(e.target.value)}
                  pattern="^#[0-9a-fA-F]{6}$"
                  className="glass rounded-lg px-2 py-1.5 text-sm w-28 font-mono"
                />
              </div>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs text-muted mb-2">Vista previa</p>
          <div className="h-10 rounded-xl" style={{ background: `linear-gradient(115deg, ${accentFrom}, ${accentVia})` }} />
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">Tipografía</h2>
        <select value={fontPreset} onChange={(e) => setFontPreset(e.target.value)} className="glass rounded-lg px-3 py-2 text-sm w-full sm:w-auto">
          {Object.entries(fontPresets).map(([key, p]) => (
            <option key={key} value={key}>{p.label}</option>
          ))}
        </select>
        <div className="rounded-xl border border-white/10 p-4">
          <p style={{ fontFamily: fontPresets[fontPreset].head, fontWeight: 800, fontSize: 24 }}>Kyma — Aa Bb Cc</p>
          <p style={{ fontFamily: fontPresets[fontPreset].body, fontSize: 14 }} className="text-muted mt-1">Cloná, diseñá y generá voces con IA en segundos.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold">Logos</h2>
        <LogoField label="Wordmark compacto (navbar, auth, footer)" currentUrl={initial.logoCompactUrl} fallback="/kyma-logo.png" name="logo_compact" />
        <LogoField label="Lockup completo · Kyma Studio (splash / carga)" currentUrl={initial.logoStudioUrl} fallback="/kyma-studio-logo.png" name="logo_studio" />
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
      )}

      <button type="submit" disabled={saving} className="btn-accent px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
