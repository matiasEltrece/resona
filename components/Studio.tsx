"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  LANGUAGES, SAMPLE_SCRIPTS,
  GENDER_OPTIONS, AGE_OPTIONS, PITCH_OPTIONS, ACCENT_OPTIONS, DIALECT_OPTIONS,
  EXPRESSIVE_TAGS, QUALITY_OPTIONS, isEnglish, isChinese,
} from "@/lib/catalog";
import type { GenerateRequest, VoiceDesign, Quality } from "@/lib/inference/types";
import ShareCard from "./ShareCard";
import VoiceOrb from "./VoiceOrb";
import voiceLibraryRaw from "@/lib/voice-library.json";

/* ─── tipos locales ──────────────────────────────────────────────────────── */
type Tab = "design" | "clone";
type GenState = "idle" | "loading" | "done" | "error";

interface Generation {
  id: string;
  src: string;
  durationMs: number;
  rtf: number;
  provider: string;
  isReal: boolean;
  commercial?: boolean;
  text: string;
  langLabel: string;
  mode: "design" | "clone";
}

/* ─── utilidades ──────────────────────────────────────────────────────────── */
function b64ToDataUrl(b64: string, mime: string) {
  return `data:${mime};base64,${b64}`;
}

/* ─── subcomponentes de UI ───────────────────────────────────────────────── */

/* Historial de generaciones en el centro: orb + reproductor compartido + lista
   (más nuevo arriba). Tocar play en cualquiera lo reproduce por el orb. */
function GenerationStage({ items, loading }: { items: Generation[]; loading: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mastered, setMastered] = useState<Record<string, string>>({});
  const [mastering, setMastering] = useState<string | null>(null);
  const [masterErr, setMasterErr] = useState<string | null>(null);
  const srcOf = (it: Generation) => mastered[it.id] ?? it.src;

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    const onTime = () => setProgress((a.currentTime / (a.duration || 1)) * 100);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); a.pause(); ctxRef.current?.close().catch(() => {}); };
  }, []);

  const ensureCtx = () => {
    if (ctxRef.current || !audioRef.current) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    an.smoothingTimeConstant = 0.82;
    ctx.createMediaElementSource(audioRef.current).connect(an);
    an.connect(ctx.destination);
    ctxRef.current = ctx;
    setAnalyser(an);
  };

  const toggle = async (it: Generation) => {
    const a = audioRef.current; if (!a) return;
    ensureCtx();
    if (ctxRef.current?.state === "suspended") await ctxRef.current.resume();
    if (current === it.id && playing) { a.pause(); setPlaying(false); return; }
    if (current !== it.id) { a.src = srcOf(it); setCurrent(it.id); setProgress(0); }
    await a.play().catch(() => {});
    setPlaying(true);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = (parseFloat(e.target.value) / 100) * (a.duration || 0);
    setProgress(parseFloat(e.target.value));
  };

  const download = (it: Generation) => {
    const x = document.createElement("a"); x.href = srcOf(it); x.download = `kyma-${it.id}.wav`; x.click();
  };

  const doMaster = async (it: Generation) => {
    if (mastered[it.id] || mastering) return;
    setMastering(it.id); setMasterErr(null);
    try {
      const res = await fetch("/api/master", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: it.src.split(",")[1] }),
      });
      const data = await res.json();
      if (!res.ok) { setMasterErr(data.code === "plan_required" ? "Masterizar es de planes pagos." : (data.error ?? "No se pudo masterizar")); return; }
      setMastered((m) => ({ ...m, [it.id]: `data:${data.mime ?? "audio/wav"};base64,${data.audioBase64}` }));
    } catch { setMasterErr("No se pudo masterizar (red/timeout)."); }
    finally { setMastering(null); }
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <VoiceOrb analyser={analyser} playing={playing} height={170} />

      {current && items.length > 0 && (
        <input
          type="range" min="0" max="100" value={progress} onChange={seek}
          className="seek-bar w-full"
          style={{ background: `linear-gradient(to right, var(--accent-from) ${progress}%, var(--c-track) ${progress}%)` }}
        />
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted">
          <span className="w-2.5 h-2.5 rounded-full pulse-ring" style={{ background: "var(--accent-grad)" }} /> Generando…
        </div>
      )}

      {items.length === 0 && !loading ? (
        <p className="text-muted text-sm text-center" style={{ marginTop: -2 }}>Generá una voz — aparece acá y se suma al historial (más nuevo arriba).</p>
      ) : items.length > 0 ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {items.map((it) => {
            const active = current === it.id;
            return (
              <div key={it.id} className={`flex items-center gap-2.5 glass rounded-xl p-2.5 ${active ? "ring-accent" : "glass-hover"}`}>
                <button onClick={() => toggle(it)} className="flex-shrink-0 w-9 h-9 rounded-full btn-accent flex items-center justify-center" aria-label={active && playing ? "Pausar" : "Reproducir"}>
                  {active && playing ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{it.text || "—"}</p>
                  <p className="text-[11px] text-muted truncate">
                    {(it.durationMs / 1000).toFixed(1)}s · {it.langLabel}
                    {it.commercial === false ? " · con marca" : it.commercial === true ? " · comercial" : ""}
                    {!it.isReal ? " · demo" : ""}
                  </p>
                </div>
                <button
                  onClick={() => doMaster(it)} disabled={mastering === it.id || !!mastered[it.id]}
                  className="flex-shrink-0 text-[11px] px-2 py-1 rounded-lg transition-all"
                  style={mastered[it.id] ? { background: "var(--accent-soft)", color: "var(--accent-solid)" } : { color: "var(--c-text-2)" }}
                  title="Masterizar (planes pagos) · EQ + loudness -16 LUFS"
                >
                  {mastered[it.id] ? "✦ máster" : mastering === it.id ? "…" : "✦ máster"}
                </button>
                <button onClick={() => download(it)} className="flex-shrink-0 text-muted hover:text-white px-2" title="Descargar WAV">↓</button>
              </div>
            );
          })}
        </div>
      ) : null}

      {masterErr && <p className="text-[11px] text-red-400 text-center">{masterErr}</p>}
      {items[0] && <ShareCard audioSrc={srcOf(items[0])} text={items[0].text} language={items[0].langLabel} mode={items[0].mode} />}
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

/* Biblioteca de voces — matriz sistemática (~100), generada (scripts/generate-voice-library.mjs).
   Filtrable por género/edad + búsqueda (estilo ElevenLabs). Tocar ▶ escucha; la tarjeta aplica el diseño. */
type LibVoice = { id: string; name: string; gender: "female" | "male"; age: string; pitch: string; lang: string; accent: string | null; whisper: boolean; flag: string; useCase: string; design: VoiceDesign; file: string };
const VOICE_LIBRARY = voiceLibraryRaw as unknown as LibVoice[];

const AGE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "child", label: "Niño" },
  { value: "teenager", label: "Adolescente" },
  { value: "young_adult", label: "Joven" },
  { value: "middle_aged", label: "Mediana" },
  { value: "elderly", label: "Mayor" },
];

const AGE_ES: Record<string, string> = { child: "Niño", teenager: "Adolescente", young_adult: "Joven", middle_aged: "Mediana", elderly: "Mayor" };
const PITCH_ES: Record<string, string> = { very_low: "Muy grave", low: "Grave", moderate: "Medio", high: "Agudo", very_high: "Muy agudo" };
function designSummary(d: VoiceDesign): string {
  const parts = [d.gender === "female" ? "Femenina" : "Masculina", AGE_ES[d.age] ?? d.age, PITCH_ES[d.pitch] ?? d.pitch];
  if (d.whisper) parts.push("Susurro");
  if (d.accent) parts.push(d.accent);
  if (d.dialect) parts.push(d.dialect);
  return parts.join(" · ");
}

function VoiceGallery({ design, setDesign }: { design: VoiceDesign; setDesign: (d: VoiceDesign) => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [gender, setGender] = useState<"all" | "female" | "male">("all");
  const [age, setAge] = useState("all");
  const [q, setQ] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const preview = (e: React.MouseEvent, v: LibVoice) => {
    e.stopPropagation();
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    if (playing === v.id) { a.pause(); setPlaying(null); return; }
    a.src = v.file; a.currentTime = 0; a.play().catch(() => {});
    a.onended = () => setPlaying(null);
    setPlaying(v.id);
  };

  const ql = q.trim().toLowerCase();
  const filtered = VOICE_LIBRARY.filter((v) =>
    (gender === "all" || v.gender === gender) &&
    (age === "all" || v.age === age) &&
    (!ql || `${v.name} ${v.useCase} ${v.lang} ${v.accent ?? ""}`.toLowerCase().includes(ql)),
  );
  const chip = (active: boolean) => `text-[11px] px-2 py-1 rounded-lg transition-all ${active ? "ring-accent text-white bg-white/10" : "glass glass-hover text-muted"}`;

  return (
    <div className="space-y-2">
      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar voz, idioma, estilo…"
        className="w-full glass rounded-lg px-3 py-1.5 text-sm bg-transparent outline-none placeholder:text-muted/50"
      />
      <div className="flex flex-wrap gap-1">
        {(["all", "female", "male"] as const).map((g) => (
          <button key={g} onClick={() => setGender(g)} className={chip(gender === g)}>
            {g === "all" ? "Todas" : g === "female" ? "♀ Fem" : "♂ Masc"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {AGE_FILTERS.map((a) => (
          <button key={a.value} onClick={() => setAge(a.value)} className={chip(age === a.value)}>{a.label}</button>
        ))}
      </div>
      <p className="text-[10px] text-muted">{filtered.length} de {VOICE_LIBRARY.length} voces</p>

      <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((v) => {
          const selected = JSON.stringify(design) === JSON.stringify(v.design);
          return (
            <div
              key={v.id}
              onClick={() => setDesign(v.design)}
              className={`flex items-center gap-2.5 glass glass-hover rounded-xl p-2.5 cursor-pointer transition-all ${selected ? "ring-accent" : ""}`}
            >
              <button
                onClick={(e) => preview(e, v)}
                aria-label={playing === v.id ? `Pausar ${v.name}` : `Escuchar ${v.name}`}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent-soft)", color: "var(--accent-solid)" }}
              >
                {playing === v.id ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{v.flag} {v.name}</p>
                <p className="text-xs text-muted truncate">{designSummary(v.design)}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent-solid)" }}>{v.useCase}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Panel-guía: enseña el sistema de diseño de voz (atributos + recetas) — la
   respuesta a "1000+ voces" sin listar mil. Las recetas aplican un diseño. */
function GuideRow({ label, items }: { label: string; items: string }) {
  return (
    <div className="flex gap-2 items-baseline">
      <span className="text-[10px] text-muted uppercase tracking-widest w-12 flex-shrink-0">{label}</span>
      <span className="text-muted">{items}</span>
    </div>
  );
}

const RECIPES: { label: string; design: VoiceDesign }[] = [
  { label: "Documental", design: { gender: "male", age: "middle_aged", pitch: "low" } },
  { label: "Niña alegre", design: { gender: "female", age: "child", pitch: "high" } },
  { label: "Abuelo sabio", design: { gender: "male", age: "elderly", pitch: "very_low" } },
  { label: "ASMR", design: { gender: "female", age: "young_adult", pitch: "moderate", whisper: true } },
  { label: "Influencer", design: { gender: "female", age: "young_adult", pitch: "high" } },
];

function VoiceGuide({ onRecipe }: { onRecipe: (d: VoiceDesign) => void }) {
  const [applied, setApplied] = useState<string | null>(null);
  const apply = (label: string, d: VoiceDesign) => {
    onRecipe(d);
    setApplied(label);
    window.setTimeout(() => setApplied((a) => (a === label ? null : a)), 2600);
  };
  return (
    <div className="glass rounded-xl p-4 space-y-3 text-xs max-h-[460px] overflow-y-auto">
      <p className="text-xs text-muted uppercase tracking-widest">Guía · qué voces podés crear</p>
      <p className="text-muted leading-relaxed">
        No hay una lista cerrada: <span className="text-gradient font-semibold">diseñás</span> la voz combinando
        atributos, o <span className="font-semibold" style={{ color: "var(--accent-solid)" }}>clonás</span> una con 10s de audio (se transcribe sola).
      </p>
      <div className="space-y-1.5">
        <GuideRow label="Género" items="Femenina · Masculina" />
        <GuideRow label="Edad" items="Niño · Adolescente · Joven · Mediana · Mayor" />
        <GuideRow label="Tono" items="Muy grave → Muy agudo (5)" />
        <GuideRow label="Estilo" items="Normal · Susurro (ASMR)" />
      </div>
      <p className="text-[11px] text-muted leading-relaxed">
        + acentos del inglés (10) · dialectos del chino (12) · <strong className="text-white/80">646 idiomas</strong>.
        Son <strong className="text-white/80">1000+ combinaciones</strong> — y la clonación es infinita.
      </p>

      <div>
        <p className="text-[10px] text-muted uppercase tracking-widest mb-1.5">Recetas rápidas (tocá para aplicar)</p>
        <div className="flex flex-wrap gap-1.5">
          {RECIPES.map((r) => (
            <button
              key={r.label}
              onClick={() => apply(r.label, r.design)}
              className="text-[11px] px-2 py-1 glass glass-hover rounded-lg text-muted hover:text-white"
            >
              {r.label}
            </button>
          ))}
        </div>
        {applied && (
          <p className="text-[11px] mt-1.5" style={{ color: "var(--accent-solid)" }}>
            ✓ «{applied}» aplicada — mirá «Voz actual» a la izquierda y generá.
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] text-muted uppercase tracking-widest mb-1.5">Efectos que funcionan (documentados)</p>
        <div className="flex flex-wrap gap-1">
          {EXPRESSIVE_TAGS.map((t) => (
            <code key={t.tag} className="text-[10px] px-1.5 py-0.5 rounded-md glass text-muted">{t.tag}</code>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-1.5">Escribilos en el texto o usá los botones. Otros tags no garantizan resultado.</p>
      </div>

      <div>
        <p className="text-[10px] text-muted uppercase tracking-widest mb-1.5">Cómo escribir</p>
        <ul className="space-y-0.5 list-disc list-inside text-muted leading-relaxed">
          <li>Puntuación natural (¿? ¡! , .) guía la entonación.</li>
          <li>Acentos del inglés: poné el idioma en English para habilitarlos.</li>
          <li>Para clonar: 10-30s de audio limpio, sin música de fondo.</li>
        </ul>
      </div>
    </div>
  );
}

function DesignPanel({
  design, setDesign, lang, savedDesigns, onSaveDesign, onLoadDesign, onDeleteVoice,
}: {
  design: VoiceDesign;
  setDesign: (d: VoiceDesign) => void;
  lang: string;
  savedDesigns: SavedVoice[];
  onSaveDesign: (name: string) => Promise<void> | void;
  onLoadDesign: (v: SavedVoice) => void;
  onDeleteVoice: (id: string) => void;
}) {
  const english = isEnglish(lang);
  const chinese = isChinese(lang);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try { await onSaveDesign(saveName.trim()); setSaveName(""); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Voz actual (refleja recetas y ajustes aplicados) */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border">
        <span className="text-[10px] text-muted uppercase tracking-widest">Voz actual</span>
        <span className="text-sm font-semibold text-gradient">{designSummary(design)}</span>
      </div>

      {/* Mis voces diseñadas (guardadas, reutilizables y consistentes) */}
      <div>
        <p className="text-xs text-muted mb-1.5 uppercase tracking-widest">Mis voces guardadas</p>
        {savedDesigns.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {savedDesigns.map((v) => (
              <span key={v.id} className="group flex items-center rounded-lg text-sm glass glass-hover">
                <button onClick={() => onLoadDesign(v)} className="pl-3 py-1.5 text-white" title="Usar esta voz">★ {v.name}</button>
                <button onClick={() => onDeleteVoice(v.id)} className="pr-2 pl-1 py-1.5 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Borrar">×</button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted mb-2">Guardá la voz actual para reusarla siempre igual (ideal para un avatar).</p>
        )}
        <div className="flex gap-2">
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Nombre (ej. «Voz de mi avatar»)"
            className="flex-1 glass rounded-lg px-3 py-1.5 text-sm bg-transparent outline-none placeholder:text-muted/50"
          />
          <button onClick={save} disabled={saving || !saveName.trim()} className="btn-accent px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Galería de voces con preview */}
      <div>
        <p className="text-xs text-muted mb-2 uppercase tracking-widest">Voces · tocá ▶ para escuchar</p>
        <VoiceGallery design={design} setDesign={setDesign} />
      </div>

      {/* Controles avanzados (colapsado por defecto) */}
      <details className="group">
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
  kind?: string;
  design?: VoiceDesign | null;
  seed?: number | null;
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

  const cloneVoices = savedVoices.filter((v) => v.kind !== "design");
  return (
    <div className="space-y-3">
      {/* Mis voces guardadas (clonadas) */}
      {cloneVoices.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-1.5 uppercase tracking-widest">Mis voces clonadas</p>
          <div className="flex flex-wrap gap-1.5">
            {cloneVoices.map((v) => (
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
  const [seed, setSeed] = useState("");
  const [genState, setGenState] = useState<GenState>("idle");
  const [results, setResults] = useState<Generation[]>([]);
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

  // ── Voces diseñadas guardadas (reutilizables + consistentes vía semilla) ──
  const savedDesigns = savedVoices.filter((v) => v.kind === "design");
  const saveDesignVoice = useCallback(async (name: string) => {
    const s = seed.trim() && !Number.isNaN(Number(seed)) ? Number(seed) : Math.floor(Math.random() * 1_000_000_000);
    if (!seed.trim()) setSeed(String(s)); // fija la semilla → la voz suena siempre igual
    await fetch("/api/voices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "design", name, design, seed: s, language: lang }),
    }).catch(() => {});
    loadVoices();
  }, [seed, design, lang, loadVoices]);
  const loadDesignVoice = useCallback((v: SavedVoice) => {
    if (v.design) setDesign(v.design);
    setSeed(v.seed != null ? String(v.seed) : "");
  }, []);
  const deleteSavedVoice = useCallback(async (id: string) => {
    if (selectedVoiceId === id) setSelectedVoiceId(null);
    await fetch(`/api/voices/${id}`, { method: "DELETE" }).catch(() => {});
    loadVoices();
  }, [loadVoices, selectedVoiceId]);

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
      setError("Para clonar una voz tenés que confirmar que es tuya o que tenés permiso para usarla.");
      setErrorCode("consent_required");
      setGenState("error");
      return;
    }

    setGenState("loading");
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
      seed: seed.trim() && !Number.isNaN(Number(seed)) ? Number(seed) : undefined,
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
      const gen: Generation = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        src: b64ToDataUrl(data.audioBase64, data.mime),
        durationMs: data.durationMs,
        rtf: data.rtf,
        provider: data.provider,
        isReal: data.isReal,
        commercial: data.commercial,
        text: text.trim().slice(0, 90),
        langLabel: selectedLang.label,
        mode: usingClone ? "clone" : "design",
      };
      setResults((prev) => [gen, ...prev]);
      setGenState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setErrorCode(null);
      setGenState("error");
    }
  }, [text, lang, tab, design, refAudio, refText, selectedVoiceId, speed, quality, genState, cloneConsent]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-5">

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {(["design", "clone"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              tab === t ? "bg-white/10 text-white ring-accent" : "text-muted hover:text-white"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {t === "design" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8.5" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.2-4.8 5-4.8s5 1.8 5 4.8" />
                  <path d="M16.5 7.5a4.5 4.5 0 0 1 0 9" /><path d="M19.5 5a8 8 0 0 1 0 14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" />
                </svg>
              )}
              {t === "design" ? "Diseñar voz" : "Clonar voz"}
            </span>
          </button>
        ))}
      </div>

      <div className="kp-studio-grid">
        {/* ── Columna A · Voz e idioma ── */}
        <div className="space-y-4 min-w-0">
          {/* Idioma */}
          <div className="glass rounded-xl p-4 space-y-2 relative z-30">
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
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">
              {tab === "design" ? "Diseño de voz" : "Voz de referencia"}
            </p>
            {tab === "design" ? (
              <DesignPanel design={design} setDesign={setDesign} lang={lang}
                savedDesigns={savedDesigns} onSaveDesign={saveDesignVoice} onLoadDesign={loadDesignVoice} onDeleteVoice={deleteSavedVoice} />
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

        </div>

        {/* ── Columna B · Texto y ajustes ── */}
        <div className="space-y-4 min-w-0">
          {/* Texto */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted uppercase tracking-widest">Texto</p>
              <span className="text-xs text-muted">{text.length}/{maxChars}</span>
            </div>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, maxChars))}
              rows={6}
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

          {/* Etapa · orb + historial de generaciones (más nuevo arriba) */}
          {error && (
            <div className="glass rounded-xl p-5 fade-up border border-red-500/20 space-y-3">
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
                  Cerrar
                </button>
              )}
            </div>
          )}
          <GenerationStage items={results} loading={genState === "loading"} />

          {/* Ajustes de generación (colapsado) */}
          <details className="glass rounded-xl p-4 group">
            <summary className="text-xs text-muted uppercase tracking-widest cursor-pointer select-none flex items-center">
              <span>Ajustes</span>
              <span className="ml-auto group-open:rotate-180 transition-transform">›</span>
            </summary>
            <div className="space-y-4 mt-3">

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
                style={{ background: `linear-gradient(to right, var(--accent-from) ${((speed - 0.5) / 1.5) * 100}%, var(--c-track) ${((speed - 0.5) / 1.5) * 100}%)` }}
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

            {/* Semilla (reproducibilidad) */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted">Semilla <span className="opacity-50">(opcional)</span></span>
                {seed && <button onClick={() => setSeed("")} className="text-muted hover:text-white">limpiar</button>}
              </div>
              <input
                type="number" value={seed} onChange={(e) => setSeed(e.target.value)}
                placeholder="Aleatoria — fijá un número para repetir la misma voz"
                className="w-full glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted/50"
              />
            </div>
            </div>
          </details>
        </div>

        {/* ── Columna C · Generar y salida ── */}
        <div className="space-y-3">
          <button
            onClick={generate}
            disabled={genState === "loading" || !text.trim()}
            className={`btn-accent rounded-xl py-3 text-sm font-semibold w-full ${genState === "loading" ? "pulse-ring" : ""}`}
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

          {/* Guía de voces */}
          <VoiceGuide onRecipe={(d) => { setTab("design"); setDesign(d); }} />
        </div>
      </div>
    </div>
  );
}
