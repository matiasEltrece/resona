"use client";

import { useState } from "react";

type Result = { present: boolean; score: number; threshold: number; samples: number };

export default function WatermarkTool() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const onFile = (f: File) => {
    setFileName(f.name); setState("loading"); setError(""); setResult(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      const b64 = url.split(",")[1];
      try {
        const res = await fetch("/api/admin/detect-watermark", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: b64 }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Error"); setState("error"); return; }
        setResult(data); setState("done");
      } catch { setError("Error de red"); setState("error"); }
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <label className="block">
        <span className="text-sm text-muted">Subí un WAV para analizar (ideal: sin recomprimir)</span>
        <input
          type="file" accept="audio/wav,audio/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          className="mt-2 block w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:btn-accent file:text-sm"
        />
      </label>

      {state === "loading" && <p className="text-sm text-muted">Analizando {fileName}…</p>}
      {state === "error" && <p className="text-sm text-red-400">{error}</p>}
      {state === "done" && result && (
        <div className={`rounded-xl p-4 ${result.present ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-border"}`}>
          <p className="text-lg font-bold">{result.present ? "✓ Tiene watermark de Kyma (Free)" : "✗ Sin watermark detectable"}</p>
          <div className="text-xs text-muted mt-2 font-mono space-y-0.5">
            <p>score {result.score} · umbral {result.threshold}</p>
            <p>{result.samples.toLocaleString()} muestras analizadas</p>
          </div>
          <p className="text-xs text-muted mt-2">
            {result.present
              ? "Audio del plan gratuito — no licenciado para uso comercial."
              : "Si igual sospechás que es de Kyma, pudo recomprimirse/editarse (el watermark v1 no es robusto a eso)."}
          </p>
        </div>
      )}
    </div>
  );
}
