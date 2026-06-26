"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";

interface ShareCardProps {
  audioSrc: string;
  text: string;
  language: string;
  mode: "design" | "clone";
}

export default function ShareCard({ audioSrc, text, language, mode }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const SITE_URL = `https://${brand.domain}`;

  const shareText = `Generé esta voz con IA en segundos con ${brand.name} 🎙✨\n${
    mode === "clone" ? "Cloné mi propia voz" : "Diseñé una voz desde cero"
  } en ${language} — probalo gratis en ${brand.domain}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${SITE_URL}?ref=share`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (!navigator.share) { copyLink(); return; }
    setSharing(true);
    try {
      const res = await fetch(audioSrc);
      const blob = await res.blob();
      const file = new File([blob], "mi-voz-kyma.wav", { type: "audio/wav" });

      await navigator.share({
        title: "Escuchá esta voz que generé con IA",
        text: shareText,
        files: navigator.canShare?.({ files: [file] }) ? [file] : undefined,
        url: `${SITE_URL}?ref=share`,
      });
    } catch {
      // usuario canceló o error → fallback a copiar link
      copyLink();
    } finally {
      setSharing(false);
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText,
  )}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="glass rounded-2xl p-4 fade-up space-y-3">
      <p className="text-xs text-muted uppercase tracking-widest">Compartir</p>
      <p className="text-xs text-muted leading-relaxed bg-white/5 rounded-lg p-2 italic">
        "{shareText.slice(0, 90)}…"
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={shareNative}
          disabled={sharing}
          className="btn-accent px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          {sharing ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          )}
          Compartir
        </button>

        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass glass-hover px-3 py-2 rounded-xl text-sm flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X/Twitter
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass glass-hover px-3 py-2 rounded-xl text-sm flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>

        <button
          onClick={copyLink}
          className="glass glass-hover px-3 py-2 rounded-xl text-sm"
        >
          {copied ? "✓ Copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
