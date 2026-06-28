"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  LANGUAGES, VOICE_PRESETS, SAMPLE_SCRIPTS,
  GENDER_OPTIONS, AGE_OPTIONS, PITCH_OPTIONS, ACCENT_OPTIONS, DIALECT_OPTIONS,
  EXPRESSIVE_TAGS, QUALITY_OPTIONS, isEnglish, isChinese,
} from "@/lib/catalog";
import type { GenerateRequest, VoiceDesign, Quality } from "@/lib/inference/types";
import ShareCard from "./ShareCard";

/* ─── tipos locales ──────────────────────────────────────────────────────── */
type Tab = "design" | "clone";
type GenState = "idle" | "loading" | "done" | "error";

interface AudioResult {
  src: string;
  durationMs: number;
  rtf: number;
  provider: string;
  isReal: boolean;
}

/* ─── utilidades ──────────────────────────────────────────────────────────── */
function b64ToDataUrl(b64: string, mime: string) {
  return `data:${mime};base64,${b64}`;
}

/* ─── subcomponentes de UI ───────────────────────────────────────────────── */

/** Onda REAL del audio: decodifica el WAV y dibuja la amplitud verdadera.
 *  La parte ya reproducida va en degradé; el resto, atenuado. */
function RealWave({ src, progress }: { src: string; progress: number }) {
  const [peaks, setPeaks] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const audio = await ctx.decodeAudioData(buf);
        const data = audio.getChannelData(0);
        const N = 56;
        const block = Math.max(1, Math.floor(data.length / N));
        const out: number[] = [];
        for (let i = 0; i < N; i++) {
          let peak = 0;
          for (let j = 0; j < block; j++) {
            const v = Math.abs(data[i * block + j] || 0);
            if (v > peak) peak = v;
          }
          out.push(peak);
        }
        const max = Math.max(...out, 0.01);
        if (!cancelled) setPeaks(out.map((p) => p / max));
        ctx.close();
      } catch { /* fallback abajo */ }
    })();
    return () => { cancelled = true; };
  }, [src]);

  const bars = peaks.length ? peaks : new Array(56).fill(0.12);
  return (
    <div className="flex items-center gap-[2px] h-12 flex-1">
      {bars.map((h, i) => {
        const played = (i / bars.length) * 100 <= progress;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(8, h * 100)}%`,
              borderRadius: 2,
              background: played ? "var(--brand-gradient-vert)" : "rgba(255,255,255,0.16)",
              transition: "background 0.1s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function AudioPlayer({ result, onNew }: { result: AudioResult; onNew: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = result.durationMs / 1000;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
  };

  const handleEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const t = (parseFloat(e.target.value) / 100) * (audioRef.current.duration || 0);
    audioRef.current.currentTime = t;
    setProgress(parseFloat(e.target.value));
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const download = () => {
    const a = document.createElement("a");
    a.href = result.src;
    a.download = `kyma-${Date.now()}.wav`;
    a.click();
  };

  return (
    <div className="glass rounded-2xl p-5 fade-up space-y-4">
      <audio ref={audioRef} src={result.src} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="w-12 h-12 rounded-full btn-accent flex items-center justify-center flex-shrink-0"
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <RealWave src={result.src} progress={progress} />
        <div className="ml-auto text-xs text-muted font-mono">
          {fmt(currentTime)} / {fmt(duration)}
        </div>
      </div>

      <input
        type="range" min="0" max="100" value={progress} onChange={seek}
        className="seek-bar w-full"
        style={{ background: `linear-gradient(to right, var(--accent-from) ${progress}%, rgba(255,255,255,0.12) ${progress}%)` }}
      />

      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex gap-3">
          {!result.isReal && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              demo · sin GPU
            </span>
          )}
          <span>RTF {result.rtf.toFixed(3)}</span>
          <span>{result.provider}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={download} className="px-3 py-1 glass glass-hover rounded-lg text-xs" title="Descargar WAV">↓ WAV</button>
          <button onClick={onNew} className="px-3 py-1 glass glass-hover rounded-lg text-xs">Nueva generación</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Selector de pills genérico ─────────────────────────────────────────── */
function Pills<T extends string>({
  value, options, onChange,
}: {
  value: T | undefined;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            value === o.value ? "ring-accent text-white bg-white/10" : "glass glass-hover text-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DesignPanel({
  design, setDesign, lang,
}: {
  design: VoiceDesign;
  setDesign: (d: VoiceDesign) => void;
  lang: string;
}) {
  const english = isEnglish(lang);
  const chinese = isChinese(lang);

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <p className="text-xs text-muted mb-2 uppercase tracking-widest">Presets</p>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setDesign(p.design)}
              className={`glass glass-hover rounded-xl p-3 text-left transition-all ${
                JSON.stringify(design) === JSON.stringify(p.design) ? "ring-accent" : ""
              }`}
            >
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-muted mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Controles avanzados */}
      <details className="group" open>
        <summary className="text-xs text-muted uppercase tracking-widest cursor-pointer select-none flex items-center gap-2">
          <span>Ajuste fino</span>
          <span className="group-open:rotate-180 transition-transform">›</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs text-muted mb-1.5">Género</p>
            <Pills value={design.gender} options={GENDER_OPTIONS} onChange={(v) => setDesign({ ...design, gender: v })} />
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Edad</p>
            <Pills value={design.age} options={AGE_OPTIONS} onChange={(v) => setDesign({ ...design, age: v })} />
          </div>
          <div>
            <p className="text-xs text-muted mb-1.5">Tono</p>
            <Pills value={design.pitch} options={PITCH_OPTIONS} onChange={(v) => setDesign({ ...design, pitch: v })} />
          </div>

          {/* Acento — solo inglés */}
          {english && (
            <div>
              <p className="text-xs text-muted mb-1.5">Acento <span className="opacity-50">(inglés)</span></p>
              <Pills
                value={design.accent}
                options={ACCENT_OPTIONS}
                onChange={(v) => setDesign({ ...design, accent: design.accent === v ? undefined : v })}
              />
            </div>
          )}

          {/* Dialecto — solo chino */}
          {chinese && (
            <div>
              <p className="text-xs text-muted mb-1.5">Dialecto <span className="opacity-50">(chino)</span></p>
              <Pills
                value={design.dialect}
                options={DIALECT_OPTIONS}
                onChange={(v) => setDesign({ ...design, dialect: design.dialect === v ? undefined : v })}
              />
            </div>
          )}

          {/* Susurro */}
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={design.whisper ?? false}
              onChange={(e) => setDesign({ ...design, whisper: e.target.checked })}
              className="accent-[var(--accent-from)] w-4 h-4"
            />
            <span className={design.whisper ? "text-white" : "text-muted"}>Susurro (estilo ASMR)</span>
          </label>
        </div>
      </details>
    </div>
  );
}

interface SavedVoice {
  id: string;
  name: string;
  ref_text: string | null;
  language: string | null;
  created_at: string;
}

function ClonePanel({
  onAudio, refText, setRefText, currentAudio,
  savedVoices, selectedVoiceId, onSelectVoice, onVoicesChanged,
}: {
  onAudio: (b64: string | undefined) => void;
  refText: string;
  setRefText: (t: string) => void;
  currentAudio: string | undefined;
  savedVoices: SavedVoice[];
  selectedVoiceId: string | null;
  onSelectVoice: (id: string | null) => void;
  onVoicesChanged: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      onAudio(url.split(",")[1]);
      setFileName(file.name);
      onSelectVoice(null); // subir audio nuevo deselecciona voz guardada
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) readFile(file);
  };

  const saveVoice = async () => {
    if (!saveName.trim() || !currentAudio) return;
    setSaving(true);
    try {
      const res = await fetch("/api/voices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), audioBase64: currentAudio, refText }),
      });
      if (res.ok) {
        setSaveName("");
        onVoicesChanged();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteVoice = async (id: string) => {
    await fetch(`/api/voices/${id}`, { method: "DELETE" });
    if (selectedVoiceId === id) onSelectVoice(null);
    onVoicesChanged();
  };

  return (
    <div className="space-y-3">
      {/* Mis voces guardadas */}
      {savedVoices.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-1.5 uppercase tracking-widest">Mis voces</p>
          <div className="flex flex-wrap gap-1.5">
            {savedVoices.map((v) => (
              <span
                key={v.id}
                className={`group flex items-center gap-1 rounded-lg text-sm transition-all ${
                  selectedVoiceId === v.id ? "ring-accent bg-white/10" : "glass glass-hover"
                }`}
              >
                <button
                  onClick={() => { onSelectVoice(v.id); setFileName(null); onAudio(undefined); }}
                  className="pl-3 py-1.5 text-white"
                >
                  🎙 {v.name}
                </button>
                <button
                  onClick={() => deleteVoice(v.id)}
                  className="pr-2 pl-1 py-1.5 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Borrar"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Uploader */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging ? "ring-accent scale-[1.01]" : "glass-hover"
        }`}
      >
        <input
          ref={inputRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
        />
        <div className="text-3xl mb-2">🎙</div>
        {fileName ? (
          <>
            <p className="text-sm font-medium text-green-400">✓ {fileName}</p>
            <p className="text-xs text-muted mt-1">Clic para cambiar</p>
          </>
        ) : selectedVoiceId ? (
          <>
            <p className="text-sm font-medium text-green-400">✓ Usando voz guardada</p>
            <p className="text-xs text-muted mt-1">O subí un audio nuevo</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Subí el audio de referencia</p>
            <p className="text-xs text-muted mt-1">MP3, WAV, M4A · mínimo 5s recomendado</p>
          </>
        )}
      </div>

      {/* Transcripción opcional */}
      <div>
        <p className="text-xs text-muted mb-1.5">
          Transcripción del audio <span className="opacity-50">(opcional)</span>
        </p>
        <input
          value={refText}
          onChange={(e) => setRefText(e.target.value)}
          placeholder="Si la dejás vacía, la transcribimos automáticamente"
          className="w-full glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted/50"
        />
      </div>

      {/* Guardar voz (solo si hay audio nuevo cargado) */}
      {currentAudio && (
        <div className="flex gap-2">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Nombre para guardar esta voz"
            className="flex-1 glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted/50"
          />
          <button
            onClick={saveVoice}
            disabled={saving || !saveName.trim()}
            className="btn-accent px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}

      <p className="text-xs text-muted">
        El modelo aprende el timbre de esa voz y la reproduce en el texto que escribas, en cualquier idioma.
      </p>
    </div>
  );
}

/* ─── Studio principal ───────────────────────────────────────────────────── */

const DEFAULT_DESIGN: VoiceDesign = {
  gender: "female",
  age: "young_adult",
  pitch: "moderate",
};

export default function Studio() {
  const [tab, setTab] = useState<Tab>("design");
  const [text, setText] = useState(SAMPLE_SCRIPTS[0]);
  const [lang, setLang] = useState("es");
  const [langQuery, setLangQuery] = useState("");
  const [design, setDesign] = useState<VoiceDesign>(DEFAULT_DESIGN);
  const [refAudio, setRefAudio] = useState<string | undefined>();
  const [refText, setRefText] = useState("");
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<Quality>("balanced");
  const [genState, setGenState] = useState<GenState>("idle");
  const [result, setResult] = useState<AudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [cloneConsent, setCloneConsent] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [savedVoices, setSavedVoices] = useState<SavedVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 5000;
  const selectedLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Cargar voces guardadas (si el usuario está logueado, devuelve la lista)
  const loadVoices = useCallback(async () => {
    try {
      const res = await fetch("/api/voices");
      if (res.ok) {
        const data = await res.json();
        setSavedVoices(data.voices ?? []);
      }
    } catch { /* sin sesión → lista vacía */ }
  }, []);

  useEffect(() => { loadVoices(); }, [loadVoices]);

  /** Inserta un tag expresivo en la posición del cursor. */
  const insertTag = (tag: string) => {
    const el = textRef.current;
    if (!el) { setText((t) => `${t} ${tag}`); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${tag}${text.slice(end)}`.slice(0, 5000);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + tag.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const generate = useCallback(async () => {
    if (!text.trim() || genState === "loading") return;

    const usingClone = tab === "clone" && (refAudio || selectedVoiceId);

    // ── Consentimiento obligatorio para clonar (anti-abuso / legal) ──────────
    if (usingClone && !cloneConsent) {
      setResult(null);
      setError("Para clonar una voz tenés que confirmar que es tuya o que tenés permiso para usarla.");
      setErrorCode("consent_required");
      setGenState("error");
      return;
    }

    setGenState("loading");
    setResult(null);
    setError(null);
    setErrorCode(null);

    const body: GenerateRequest = {
      text,
      language: lang,
      mode: usingClone ? "clone" : "design",
      design: tab === "design" ? design : undefined,
      referenceAudioBase64: tab === "clone" ? refAudio : undefined,
      referenceText: tab === "clone" && refText.trim() ? refText.trim() : undefined,
      savedVoiceId: tab === "clone" && selectedVoiceId ? selectedVoiceId : undefined,
      consent: usingClone ? true : undefined,
      speed,
      quality,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error del servidor");
        setErrorCode(data.code ?? null);
        setGenState("error");
        return;
      }
      setResult({
        src: b64ToDataUrl(data.audioBase64, data.mime),
        durationMs: data.durationMs,
        rtf: data.rtf,
        provider: data.provider,
        isReal: data.isReal,
      });
      setGenState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setErrorCode(null);
      setGenState("error");
    }
  }, [text, lang, tab, design, refAudio, refText, selectedVoiceId, speed, quality, genState, cloneConsent]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {(["design", "clone"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? "bg-white/10 text-white ring-accent" : "text-muted hover:text-white"
            }`}
          >
            {t === "design" ? "🎨 Diseñar voz" : "🎙 Clonar voz"}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Panel izquierdo ── */}
        <div className="space-y-4">
          {/* Texto */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted uppercase tracking-widest">Texto</p>
              <span className="text-xs text-muted">{text.length}/{maxChars}</span>
            </div>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, maxChars))}
              rows={5}
              placeholder="Escribí o pegá el texto que querés generar..."
              className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-muted/50"
            />

            {/* Toolbar de tags expresivos */}
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-[10px] text-muted uppercase tracking-widest mb-1.5">Efectos expresivos</p>
              <div className="flex flex-wrap gap-1.5">
                {EXPRESSIVE_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => insertTag(t.tag)}
                    title={`Insertar ${t.tag}`}
                    className="text-xs px-2 py-1 glass glass-hover rounded-lg text-muted hover:text-white"
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scripts de ejemplo */}
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
              {SAMPLE_SCRIPTS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setText(s)}
                  className="text-xs px-2 py-1 glass glass-hover rounded-lg text-muted"
                >
                  Ejemplo {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Idioma */}
          <div className="glass rounded-2xl p-4 space-y-2 relative z-30">
            <p className="text-xs text-muted uppercase tracking-widest">Idioma <span className="opacity-50">· 646 disponibles</span></p>
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setLangQuery(""); }}
                className="flex items-center gap-2 glass glass-hover rounded-xl px-3 py-2 text-sm w-full"
              >
                <span className="text-xl">{selectedLang.flag}</span>
                <span>{selectedLang.label}</span>
                <span className="ml-auto text-muted">{langOpen ? "▲" : "▼"}</span>
              </button>
              {langOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-20 overflow-hidden border border-border shadow-2xl" style={{ background: "var(--bg-elevated)" }}>
                  <div className="p-2 border-b border-border">
                    <input
                      autoFocus
                      value={langQuery}
                      onChange={(e) => setLangQuery(e.target.value)}
                      placeholder="Buscar entre 646 idiomas…"
                      className="w-full bg-transparent outline-none text-sm placeholder:text-muted/50"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {LANGUAGES
                      .filter((l) => {
                        const q = langQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          l.label.toLowerCase().includes(q) ||
                          l.code.toLowerCase().includes(q) ||
                          (l.canonical?.toLowerCase().includes(q) ?? false)
                        );
                      })
                      .slice(0, 80)
                      .map((l) => (
                        <button
                          key={`${l.code}-${l.label}`}
                          onClick={() => { setLang(l.code); setLangOpen(false); }}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                            l.code === lang ? "bg-white/5 text-white" : "text-muted"
                          }`}
                        >
                          <span className="text-lg">{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel de voz */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">
              {tab === "design" ? "Diseño de voz" : "Voz de referencia"}
            </p>
            {tab === "design" ? (
              <DesignPanel design={design} setDesign={setDesign} lang={lang} />
            ) : (
              <>
                <ClonePanel
                  onAudio={setRefAudio}
                  refText={refText}
                  setRefText={setRefText}
                  currentAudio={refAudio}
                  savedVoices={savedVoices}
                  selectedVoiceId={selectedVoiceId}
                  onSelectVoice={setSelectedVoiceId}
                  onVoicesChanged={loadVoices}
                />
                {/* Consentimiento obligatorio para clonar */}
                <label className="flex items-start gap-2 mt-3 cursor-pointer text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={cloneConsent}
                    onChange={(e) => setCloneConsent(e.target.checked)}
                    className="mt-0.5 accent-[var(--accent-via)]"
                  />
                  <span>
                    Confirmo que esta voz es mía o que tengo permiso para clonarla, y acepto los{" "}
                    <a href="/terminos" target="_blank" className="underline hover:text-white">términos de uso</a>.
                    Clonar voces de terceros sin consentimiento está prohibido.
                  </span>
                </label>
              </>
            )}
          </div>

          {/* Ajustes de generación */}
          <div className="glass rounded-2xl p-4 space-y-4">
            <p className="text-xs text-muted uppercase tracking-widest">Ajustes</p>

            {/* Velocidad */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted">Velocidad</span>
                <span className="text-white font-mono">{speed.toFixed(2)}×</span>
              </div>
              <input
                type="range" min="0.5" max="2" step="0.05" value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="seek-bar w-full"
                style={{ background: `linear-gradient(to right, var(--accent-from) ${((speed - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.12) ${((speed - 0.5) / 1.5) * 100}%)` }}
              />
              <div className="flex justify-between text-[10px] text-muted mt-0.5">
                <span>Lento</span><span>Normal</span><span>Rápido</span>
              </div>
            </div>

            {/* Calidad */}
            <div>
              <p className="text-xs text-muted mb-1.5">Calidad</p>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setQuality(q.value)}
                    title={q.desc}
                    className={`rounded-xl p-2 text-center transition-all ${
                      quality === q.value ? "ring-accent bg-white/10" : "glass glass-hover"
                    }`}
                  >
                    <p className="text-sm font-medium">{q.label}</p>
                    <p className="text-[10px] text-muted mt-0.5">{q.desc.split("·")[0].trim()}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div className="space-y-4 flex flex-col">
          <button
            onClick={generate}
            disabled={genState === "loading" || !text.trim()}
            className={`btn-accent rounded-2xl py-5 text-lg font-semibold w-full ${genState === "loading" ? "pulse-ring" : ""}`}
          >
            {genState === "loading" ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span className="flex flex-col items-start leading-tight">
                  <span>Generando…</span>
                  <span className="text-xs opacity-60 font-normal">primera vez puede tardar ~60s</span>
                </span>
              </span>
            ) : (
              "✦ Generar voz"
            )}
          </button>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Idiomas", value: "646" },
              { label: "RTF", value: "0.025" },
              { label: "Latencia", value: "<1s" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3">
                <p className="text-xl font-bold text-gradient">{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {result ? (
            <>
              <AudioPlayer result={result} onNew={() => { setResult(null); setGenState("idle"); }} />
              <ShareCard audioSrc={result.src} text={text} language={selectedLang.label} mode={tab} />
            </>
          ) : error ? (
            <div className="glass rounded-2xl p-5 fade-up border border-red-500/20 space-y-3">
              <p className="text-red-400 text-sm font-medium">
                {errorCode === "credits_exhausted" ? "Te quedaste sin caracteres" : "⚠ Error"}
              </p>
              <p className="text-muted text-xs">{error}</p>
              {errorCode === "credits_exhausted" ? (
                <a href="/dashboard" className="btn-accent inline-block px-4 py-2 rounded-xl text-xs font-semibold">
                  Comprar créditos o subir de plan →
                </a>
              ) : errorCode === "login_required" ? (
                <a href="/auth/login" className="btn-accent inline-block px-4 py-2 rounded-xl text-xs font-semibold">
                  Iniciar sesión
                </a>
              ) : (
                <button
                  onClick={() => { setError(null); setErrorCode(null); setGenState("idle"); }}
                  className="text-xs text-red-400 underline hover:text-red-300 transition-colors"
                >
                  Reintentar
                </button>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center flex-1 min-h-[180px]">
              <div className="flex items-end gap-[3px] h-10 opacity-30">
                {[30, 55, 80, 45, 90, 60, 75, 40, 85, 50].map((h, i) => (
                  <div key={i} className="bar" style={{ height: `${h}%`, animationPlayState: "paused" }} />
                ))}
              </div>
              <p className="text-muted text-sm">Tu audio aparecerá acá</p>
            </div>
          )}

          {/* Tip */}
          <div className="glass rounded-xl p-3 text-xs text-muted space-y-1">
            <p className="text-white/60 font-medium">💡 Cómo sacar el máximo:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Insertá efectos como <code>[laughter]</code> o <code>[sigh]</code> con los botones</li>
              <li>Acentos del inglés: cambiá el idioma a English para habilitarlos</li>
              <li>La voz de clonación mejora con +30s de audio limpio</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
