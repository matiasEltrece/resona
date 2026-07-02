"use client";

import { useState } from "react";
import Link from "next/link";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const createKey = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "API key" }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey(data.key);
        setKeys((k) => [{ ...data, revoked: false, last_used_at: null }, ...k]);
        setName("");
      } else {
        setError(data.error ?? "No se pudo crear la key. Probá de nuevo.");
      }
    } catch {
      setError("No se pudo crear la key (red/timeout). Probá de nuevo.");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    setRevokingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((k) => k.filter((x) => x.id !== id));
      } else {
        setError("No se pudo revocar la key. Probá de nuevo — no la des por revocada.");
      }
    } catch {
      setError("No se pudo revocar la key (red/timeout). No la des por revocada.");
    } finally {
      setRevokingId(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X POST https://kyma.synthetic.com.ar/api/v1/generate \\
  -H "Authorization: Bearer ${newKey ?? "kyma_sk_..."}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hola, esto es Kyma por API.",
    "language": "es",
    "mode": "design",
    "design": { "gender": "female", "age": "young_adult", "pitch": "moderate" },
    "quality": "balanced"
  }'`;

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API & claves</h1>
          <p className="text-muted text-sm mt-1">Integrá la voz de Kyma en tu producto.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-white">← Volver</Link>
      </div>

      {/* Crear key */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Generar una API key</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre (ej. Producción, App móvil)"
            className="flex-1 glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted/50"
          />
          <button onClick={createKey} disabled={creating} className="btn-accent px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            {creating ? "Creando…" : "Crear key"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {newKey && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
            <p className="text-xs text-green-400 font-medium">✓ Key creada — copiala ahora, no se vuelve a mostrar:</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-xs bg-black/30 rounded-lg px-3 py-2 font-mono break-all">{newKey}</code>
              <button onClick={() => copy(newKey)} className="glass glass-hover px-3 py-2 rounded-lg text-xs whitespace-nowrap">
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de keys */}
      <div className="glass rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">Tus keys</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-muted">Todavía no tenés keys. Creá una arriba.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted font-mono">{k.key_prefix}••••••••</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    {k.last_used_at ? `Usada ${new Date(k.last_used_at).toLocaleDateString()}` : "Sin usar"}
                  </span>
                  <button onClick={() => revoke(k.id)} disabled={revokingId === k.id} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
                    {revokingId === k.id ? "Revocando…" : "Revocar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quickstart */}
      <div className="glass rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Quickstart</h2>
          <a href="/docs" className="text-xs text-accent underline">Docs completos →</a>
        </div>
        <pre className="text-xs bg-black/30 rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">{curlExample}</pre>
        <p className="text-xs text-muted">La respuesta es JSON con <code>audioBase64</code> (WAV en base64), <code>durationMs</code> y <code>rtf</code>.</p>
      </div>
    </div>
  );
}
