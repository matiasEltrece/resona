"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   KYMA · Landing premium (dorado/claro + dark) — diseño de Claude Design,
   implementado con datos y audio reales de Kyma.
   ────────────────────────────────────────────────────────────────────────── */

interface Voice {
  name: string; char: string; lang: string; flag: string; src: string;
  tone: number; energy: number; clarity: number;
}
const VOICES: Voice[] = [
  { name: "Aurora", char: "cálida",   lang: "ES-AR", flag: "🇦🇷", src: "/radio/aurora.wav", tone: 62, energy: 70, clarity: 88 },
  { name: "Atlas",  char: "profunda", lang: "EN-GB", flag: "🇬🇧", src: "/radio/atlas.wav",  tone: 38, energy: 55, clarity: 82 },
  { name: "Nova",   char: "enérgica", lang: "PT-BR", flag: "🇧🇷", src: "/radio/nova.wav",   tone: 74, energy: 90, clarity: 80 },
  { name: "Sora",   char: "suave",    lang: "JA",    flag: "🇯🇵", src: "/radio/sora.wav",   tone: 58, energy: 44, clarity: 86 },
  { name: "Echo",   char: "suave",    lang: "ES",    flag: "🇪🇸", src: "/radio/echo.wav",   tone: 52, energy: 48, clarity: 84 },
  { name: "Leo",    char: "narrador", lang: "IT",    flag: "🇮🇹", src: "/radio/leo.wav",    tone: 46, energy: 60, clarity: 90 },
];

const FEATURES = [
  { t: "Cloná tu voz", d: "Grabá 10 segundos de audio limpio y replicá tu voz en cualquiera de los 646 idiomas.", i: "mic" },
  { t: "Diseñá voces", d: "Ajustá tono, edad y carácter. Creá una identidad sonora desde cero, sin grabar nada.", i: "sliders" },
  { t: "Generación <1s", d: "Latencia mínima. RTF 0.025 — hasta 40× más rápido que el tiempo real.", i: "time" },
  { t: "646 idiomas", d: "Doblaje y traducción de voz que cruzan cualquier frontera, con tu propia voz.", i: "globe" },
  { t: "API REST", d: "Integrá Kyma en tu producto con un solo endpoint. Disponible en el plan Pro.", i: "code" },
  { t: "Métricas en vivo", d: "Caracteres, latencia y uso, monitoreados en tiempo real desde tu dashboard.", i: "metrics" },
];

const STEPS = [
  { n: "01", t: "Subí o grabá", d: "Con 10 segundos de audio limpio alcanza para clonar tu voz. La transcribimos automáticamente." },
  { n: "02", t: "Elegí el idioma", d: "646 opciones. Seleccioná el idioma destino y el carácter de la voz que querés generar." },
  { n: "03", t: "Generá y descargá", d: "En menos de un segundo tenés tu audio listo para usar, exportar o integrar por API." },
];

const STATS = [
  { v: "646", l: "Idiomas soportados" },
  { v: "0.025", l: "RTF — factor de tiempo real" },
  { v: "<1s", l: "Generación de voz" },
  { v: "10k", l: "Caracteres gratis / mes" },
];

export default function LandingPremium({
  isAuthed = false,
  creatorUrl,
  proUrl,
}: { isAuthed?: boolean; creatorUrl: string; proUrl: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [dark, setDark] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const curRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const indexRef = useRef(0);
  indexRef.current = index;
  playingRef.current = playing;

  // Tema (claro por defecto · persistido)
  useEffect(() => {
    const saved = localStorage.getItem("kyma-theme");
    if (saved === "dark") setDark(true);
  }, []);
  const toggleTheme = () => setDark((d) => { localStorage.setItem("kyma-theme", d ? "light" : "dark"); return !d; });

  const ensureAudio = useCallback(() => {
    if (ctxRef.current || !audioRef.current) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.82;
    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    freqRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }, []);

  const play = useCallback(async () => {
    ensureAudio();
    if (ctxRef.current?.state === "suspended") await ctxRef.current.resume();
    const a = audioRef.current;
    if (!a) return;
    if (!a.src || !a.src.includes(VOICES[indexRef.current].src)) a.src = VOICES[indexRef.current].src;
    try { await a.play(); setPlaying(true); } catch { /* autoplay bloqueado */ }
  }, [ensureAudio]);

  const stop = useCallback(() => { audioRef.current?.pause(); setPlaying(false); }, []);
  const toggle = useCallback(() => { if (playingRef.current) stop(); else play(); }, [play, stop]);

  const select = useCallback((i: number) => {
    const ni = (i + VOICES.length) % VOICES.length;
    setIndex(ni);
    const a = audioRef.current;
    if (a) {
      a.src = VOICES[ni].src;
      if (playingRef.current) { ensureAudio(); ctxRef.current?.resume(); a.play().catch(() => {}); }
    }
  }, [ensureAudio]);
  const next = useCallback(() => select(indexRef.current + 1), [select]);
  const prev = useCallback(() => select(indexRef.current - 1), [select]);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onEnded = () => select(indexRef.current + 1);
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [select]);

  // Visualizador radial (FFT real cuando suena; idle suave cuando no)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let dpr = 1;
    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    const N = 72;
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const base = Math.min(W, H) * 0.27;
      if (curRef.current.length !== N) curRef.current = new Array(N).fill(0.04);
      const targets = new Array(N).fill(0);
      const isPlaying = playingRef.current;
      const analyser = analyserRef.current, freq = freqRef.current;
      if (isPlaying && analyser && freq) {
        analyser.getByteFrequencyData(freq);
        const usable = Math.floor(freq.length * 0.6);
        for (let n = 0; n < N; n++) {
          const idx = Math.floor((n / N) * usable);
          let v = freq[idx] / 255; v = Math.pow(v, 0.9);
          targets[n] = v;
        }
      } else {
        const t = performance.now() / 1000;
        for (let n = 0; n < N; n++) targets[n] = 0.05 + 0.06 * (0.6 + 0.4 * Math.sin(t * 1.2 + n * 0.5));
      }
      for (let n = 0; n < N; n++) {
        const sp = isPlaying ? 0.45 : 0.08;
        curRef.current[n] += (targets[n] - curRef.current[n]) * sp;
      }
      // anillos que respiran
      const breathe = 1 + 0.02 * Math.sin(performance.now() / 700);
      ctx.strokeStyle = dark ? "rgba(210,166,79,0.16)" : "rgba(199,154,69,0.20)";
      ctx.lineWidth = 1;
      for (const rr of [0.62, 0.82, 1]) { ctx.beginPath(); ctx.arc(cx, cy, base * rr * breathe, 0, Math.PI * 2); ctx.stroke(); }
      // barras radiales
      ctx.lineCap = "round";
      for (let n = 0; n < N; n++) {
        const ang = (n / N) * Math.PI * 2 - Math.PI / 2;
        const len = base * 0.45 + curRef.current[n] * base * 1.15;
        const x1 = cx + Math.cos(ang) * base, y1 = cy + Math.sin(ang) * base;
        const x2 = cx + Math.cos(ang) * (base + len), y2 = cy + Math.sin(ang) * (base + len);
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, dark ? "#f0da9f" : "#ecd49a");
        g.addColorStop(1, dark ? "#d2a64f" : "#c79a45");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = dark ? "rgba(210,166,79,0.45)" : "rgba(199,154,69,0.4)";
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // núcleo
      ctx.shadowBlur = 0;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.55);
      core.addColorStop(0, dark ? "rgba(240,218,159,0.30)" : "rgba(236,212,154,0.5)");
      core.addColorStop(1, "transparent");
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(cx, cy, base * 0.55, 0, Math.PI * 2); ctx.fill();
    };
    draw();
    return () => { window.removeEventListener("resize", sizeCanvas); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [dark]);

  const v = VOICES[index];

  // ── recetas de estilo (inline, según el diseño) ──
  const sBtn: React.CSSProperties = { background: "var(--c-btn)", color: "var(--c-btn-text)", border: "1px solid transparent", borderRadius: 12, fontWeight: 600, padding: "12px 22px", fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "var(--c-shadow-soft)", cursor: "pointer", textDecoration: "none" };
  const sGhost: React.CSSProperties = { background: "var(--c-btn-2-bg)", color: "var(--c-text)", border: "1px solid var(--c-border-2)", borderRadius: 12, fontWeight: 600, padding: "12px 22px", fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none" };
  const card: React.CSSProperties = { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 18, boxShadow: "var(--c-shadow-soft)" };
  const gold: React.CSSProperties = { background: "var(--accent-grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
  const mono = "var(--font-mono, ui-monospace, monospace)";

  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ width: 22, height: 3, borderRadius: 2, background: "var(--accent-grad)" }} />
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--c-text-3)" }}>{children}</span>
    </div>
  );
  const Bar = ({ pct }: { pct: number }) => (
    <div style={{ height: 6, borderRadius: 99, background: "var(--c-track)", overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent-grad)", borderRadius: 99 }} />
    </div>
  );

  return (
    <div className="kyma-premium" data-theme={dark ? "dark" : undefined}
      style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "var(--c-page)", color: "var(--c-text)", fontFamily: "var(--font-body)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Space+Grotesk:wght@400..600&display=swap');
        .kyma-premium{
          --gold-1:#ecd49a; --gold-2:#c79a45; --gold-3:#a87f33;
          --accent-grad:linear-gradient(115deg,var(--gold-1),var(--gold-2));
          --accent-solid:#bd8f3d; --accent-glow:rgba(199,154,69,0.45); --accent-soft:rgba(199,154,69,0.12);
          --c-page:#f1f1f3; --c-surface:#ffffff; --c-surface-2:#f6f6f8;
          --c-border:rgba(18,17,24,0.09); --c-border-2:rgba(18,17,24,0.15);
          --c-text:#131218; --c-text-2:#605e6c; --c-text-3:#9b99a6;
          --c-btn:#15141a; --c-btn-text:#ffffff; --c-btn-2-bg:#ffffff;
          --c-track:rgba(18,17,24,0.08);
          --c-shadow:0 1px 2px rgba(18,17,24,0.05),0 24px 48px -28px rgba(18,17,24,0.28);
          --c-shadow-soft:0 1px 2px rgba(18,17,24,0.04),0 14px 34px -26px rgba(18,17,24,0.20);
          --c-blueprint:rgba(18,17,24,0.10);
          --font-head:'Bricolage Grotesque',system-ui,sans-serif;
          --font-body:'Space Grotesk',system-ui,sans-serif;
        }
        .kyma-premium[data-theme="dark"]{
          --gold-1:#f0da9f; --gold-2:#d2a64f;
          --accent-glow:rgba(210,166,79,0.5); --accent-soft:rgba(210,166,79,0.14);
          --c-page:#070611; --c-surface:rgba(255,255,255,0.035); --c-surface-2:rgba(255,255,255,0.02);
          --c-border:rgba(255,255,255,0.09); --c-border-2:rgba(255,255,255,0.16);
          --c-text:#f5f3ff; --c-text-2:#a9a5bd; --c-text-3:#6f6b85;
          --c-btn:#f5f3ff; --c-btn-text:#0b0916; --c-btn-2-bg:rgba(255,255,255,0.04);
          --c-track:rgba(255,255,255,0.10);
          --c-shadow:0 10px 40px -14px rgba(0,0,0,0.65);
          --c-shadow-soft:0 10px 34px -18px rgba(0,0,0,0.55);
          --c-blueprint:rgba(255,255,255,0.08);
        }
        .kyma-premium h1,.kyma-premium h2,.kyma-premium h3{font-family:var(--font-head);margin:0}
        .kyma-premium a.kp-nav{color:var(--c-text-2);text-decoration:none;font-size:14px}
        .kyma-premium a.kp-nav:hover{color:var(--c-text)}
        .kyma-premium .kp-card-h{transition:transform .18s ease,box-shadow .18s ease}
        .kyma-premium .kp-card-h:hover{transform:translateY(-2px);box-shadow:var(--c-shadow)}
        .kyma-premium .kp-row{transition:background .15s ease}
        .kyma-premium .kp-row:hover{background:var(--c-surface-2)}
        @media(max-width:980px){.kyma-premium .kp-hero{grid-template-columns:1fr!important}.kyma-premium .kp-3{grid-template-columns:1fr!important}.kyma-premium .kp-4{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>

      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--c-page)", borderBottom: "1px solid var(--c-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", height: 72, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><g stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="9" x2="5" y2="15" /><line x1="10" y1="5" x2="10" y2="19" /><line x1="15" y1="7" x2="15" y2="17" /><line x1="20" y1="10" x2="20" y2="14" /></g></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-head)" }}>Kyma</span>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", border: "1px solid var(--c-border-2)", borderRadius: 99, padding: "2px 8px", color: "var(--c-text-3)" }}>beta</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }} className="kp-navlinks">
            <a className="kp-nav" href="#features">Producto</a>
            <a className="kp-nav" href="#steps">Cómo funciona</a>
            <a className="kp-nav" href="#pricing">Precios</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={toggleTheme} aria-label="Cambiar tema" style={{ width: 38, height: 38, borderRadius: 10, background: "var(--c-surface-2)", border: "1px solid var(--c-border-2)", color: "var(--c-text-2)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {dark ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <a className="kp-nav" href={isAuthed ? "/dashboard" : "/auth/login"}>{isAuthed ? "Mi cuenta" : "Ingresar"}</a>
            <a href="/studio" style={sBtn}>Empezar gratis</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 32px 76px" }}>
        <div className="kp-hero" style={{ display: "grid", gridTemplateColumns: "minmax(290px,0.92fr) minmax(320px,1fr) 360px", columnGap: 56, rowGap: 40, alignItems: "start" }}>
          {/* copy */}
          <div>
            <Eyebrow>Tu voz · tu idioma · en segundos</Eyebrow>
            <h1 style={{ fontSize: "clamp(42px,5.1vw,72px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
              Cualquier voz.<br /><span style={gold}>Cualquier idioma.</span>
            </h1>
            <p style={{ maxWidth: 430, marginTop: 22, color: "var(--c-text-2)", fontSize: 17, lineHeight: 1.6 }}>
              Cloná, diseñá y generá voces con IA en 646 idiomas. Grabá 10 segundos y replicá tu voz en segundos. Sin estudio, sin GPU.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <a href="/studio" style={sBtn}>Probalo gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <button onClick={toggle} style={sGhost}>
                {playing ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                Escuchar voces
              </button>
            </div>
            <div style={{ display: "flex", gap: 34, marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--c-border)" }}>
              {[["646", "Idiomas"], ["<1s", "Generación"], ["10k", "Chars gratis / mes"]].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-head)" }}>{n}</div>
                  <div style={{ fontSize: 12, color: "var(--c-text-3)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* orb */}
          <div style={{ position: "relative", width: "100%", maxWidth: 470, aspectRatio: "1", margin: "0 auto" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
            <span style={{ position: "absolute", left: 6, top: 6, fontFamily: mono, fontSize: 10, color: "var(--c-text-3)" }}>● LIVE</span>
            <span style={{ position: "absolute", right: 6, top: 6, fontFamily: mono, fontSize: 10, color: "var(--c-text-3)" }}>RTF 0.025</span>
            <span style={{ position: "absolute", left: 6, bottom: 36, fontFamily: mono, fontSize: 10, color: "var(--c-text-3)" }}>FREQ 0–8k</span>
            <span style={{ position: "absolute", right: 6, bottom: 36, fontFamily: mono, fontSize: 10, color: "var(--c-text-3)" }}>646 LANG</span>
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--c-text-2)", border: "1px solid var(--c-border)", borderRadius: 99, padding: "4px 12px", background: "var(--c-surface)", whiteSpace: "nowrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-solid)", boxShadow: "0 0 8px var(--accent-glow)" }} />
              {v.name} · onda en vivo
            </div>
          </div>

          {/* player panel */}
          <div style={{ ...card, borderRadius: 22, boxShadow: "var(--c-shadow)", padding: 22, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--accent-grad)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--c-text-3)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Reproductor</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: "var(--c-text-3)" }}>{index + 1} / {VOICES.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-head)" }}>{v.name}</span>
              <span style={{ fontSize: 20 }}>{v.flag}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 12, border: "1px solid var(--c-border-2)", borderRadius: 99, padding: "3px 11px", color: "var(--c-text-2)" }}>{v.char}</span>
              <span style={{ fontFamily: mono, fontSize: 12, border: "1px solid var(--c-border-2)", borderRadius: 99, padding: "3px 11px", color: "var(--c-text-3)" }}>{v.lang}</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {([["Tono", v.tone], ["Energía", v.energy], ["Claridad", v.clarity]] as [string, number][]).map(([l, pct]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--c-text-2)", width: 58 }}>{l}</span>
                  <Bar pct={pct} />
                  <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-3)", width: 30, textAlign: "right" }}>{pct}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 18 }}>
              <button onClick={prev} aria-label="Anterior" style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--c-surface-2)", border: "1px solid var(--c-border-2)", color: "var(--c-text-2)", cursor: "pointer" }}>◁</button>
              <button onClick={toggle} aria-label="Play" style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--accent-grad)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 10px 26px -8px var(--accent-glow)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {playing ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z" /></svg>}
              </button>
              <button onClick={next} aria-label="Siguiente" style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--c-surface-2)", border: "1px solid var(--c-border-2)", color: "var(--c-text-2)", cursor: "pointer" }}>▷</button>
            </div>
            <div style={{ borderTop: "1px solid var(--c-border)", marginTop: 18, paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--c-text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Cola de voces</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-3)" }}>{VOICES.length} voces</span>
              </div>
              {VOICES.map((vo, k) => (
                <button key={k} onClick={() => select(k)} className="kp-row" style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 10, border: "none", cursor: "pointer", background: k === index ? "var(--accent-soft)" : "transparent", textAlign: "left" }}>
                  <span style={{ width: 3, height: 16, borderRadius: 2, background: k === index ? "var(--accent-grad)" : "var(--c-border-2)" }} />
                  <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-3)" }}>{String(k + 1).padStart(2, "0")}</span>
                  <span style={{ fontSize: 13, fontWeight: k === index ? 700 : 500, color: "var(--c-text)" }}>{vo.name}</span>
                  <span style={{ fontSize: 13 }}>{vo.flag}</span>
                  <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 11, color: "var(--c-text-3)" }}>{vo.lang}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 26, fontSize: 12, color: "var(--c-text-3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-solid)" }} />
          Voces reales pre-generadas con Kyma · escuchá la onda en vivo
        </p>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px 30px" }}>
        <Eyebrow>Qué podés hacer</Eyebrow>
        <h2 style={{ fontSize: "clamp(30px,3.6vw,44px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 26 }}>Una herramienta, <span style={gold}>infinitos usos</span></h2>
        <div className="kp-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {FEATURES.map((f) => (
            <div key={f.t} className="kp-card-h" style={{ ...card, padding: 24 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 18px -10px var(--accent-glow)" }}>
                <Icon name={f.i} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{f.t}</h3>
              <p style={{ fontSize: 14, color: "var(--c-text-2)", lineHeight: 1.55 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ── */}
      <section id="steps" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px 30px" }}>
        <Eyebrow>Cómo funciona</Eyebrow>
        <h2 style={{ fontSize: "clamp(30px,3.6vw,44px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 26 }}>Creá una voz en <span style={gold}>3 pasos</span></h2>
        <div className="kp-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ ...card, padding: 24 }}>
              <div style={{ ...gold, fontFamily: mono, fontSize: 26, fontWeight: 700, marginBottom: 10 }}>{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{s.t}</h3>
              <p style={{ fontSize: 14, color: "var(--c-text-2)", lineHeight: 1.55 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 32px" }}>
        <div className="kp-4" style={{ ...card, borderRadius: 22, boxShadow: "var(--c-shadow)", padding: "44px 36px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {STATS.map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ ...gold, fontSize: 40, fontWeight: 800, fontFamily: "var(--font-head)" }}>{s.v}</div>
              <div style={{ fontSize: 13, color: "var(--c-text-2)", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px 30px" }}>
        <Eyebrow>Precios</Eyebrow>
        <h2 style={{ fontSize: "clamp(30px,3.6vw,44px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 26 }}>Empezá gratis, <span style={gold}>crecé cuando estés listo</span></h2>
        <div className="kp-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, alignItems: "stretch" }}>
          {[
            { name: "Gratis", price: "$0", tag: "Para probar y proyectos chicos.", feats: ["10.000 caracteres / mes", "Voces estándar", "Generación en <1s", "646 idiomas"], cta: "Empezar gratis", href: "/studio", feat: false },
            { name: "Creator", price: "$12", tag: "Para creadores que producen seguido.", feats: ["200.000 caracteres / mes", "Clonación de voz", "Sin marca de agua", "Descarga en alta calidad"], cta: "Probar Creator", href: creatorUrl, feat: true },
            { name: "Pro", price: "$39", tag: "Para equipos y productos.", feats: ["1.000.000 caracteres / mes", "Acceso a la API REST", "Métricas en vivo", "Soporte prioritario"], cta: "Ir a Pro", href: proUrl, feat: false },
          ].map((p) => (
            <div key={p.name} style={{ ...card, padding: 26, display: "flex", flexDirection: "column", position: "relative", border: p.feat ? "1.5px solid var(--accent-solid)" : "1px solid var(--c-border)", boxShadow: p.feat ? "var(--c-shadow)" : "var(--c-shadow-soft)" }}>
              {p.feat && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--accent-grad)", color: "#1a1408", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99 }}>Más elegido</span>}
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text-2)" }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "6px 0 4px" }}>
                <span style={{ fontSize: 40, fontWeight: 800, fontFamily: "var(--font-head)" }}>{p.price}</span>
                <span style={{ fontSize: 14, color: "var(--c-text-3)" }}>/mes</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--c-text-3)", marginBottom: 16 }}>{p.tag}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 9 }}>
                {p.feats.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "var(--c-text)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-solid)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{f}
                  </li>
                ))}
              </ul>
              <a href={p.href} style={{ ...(p.feat ? sBtn : sGhost), marginTop: "auto", justifyContent: "center" }}>{p.cta}</a>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--c-text-3)" }}>Solo para uso responsable y con consentimiento de las voces clonadas.</p>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 32px 50px" }}>
        <div style={{ ...card, borderRadius: 26, padding: "70px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(50% 70% at 50% 0%, var(--accent-soft), transparent 70%)" }} />
          <h2 style={{ position: "relative", fontSize: "clamp(30px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.02em" }}>Dale voz a todo lo que <span style={gold}>imaginás</span></h2>
          <p style={{ position: "relative", color: "var(--c-text-2)", marginTop: 12, fontSize: 17 }}>Cualquier voz. Cualquier idioma. En segundos.</p>
          <div style={{ position: "relative", display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <a href="/studio" style={sBtn}>Empezá gratis ✦</a>
            <a href="/docs" style={sGhost}>Ver la API</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--c-border)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "26px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--c-text-3)" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24"><g stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><line x1="6" y1="9" x2="6" y2="15" /><line x1="12" y1="5" x2="12" y2="19" /><line x1="18" y1="8" x2="18" y2="16" /></g></svg>
            </div>
            <strong style={{ color: "var(--c-text-2)" }}>Kyma</strong> · © 2026 · kyma.synthetic.com.ar
          </div>
          <div style={{ display: "flex", gap: 22 }}>
            <a className="kp-nav" href="#pricing">Precios</a>
            <a className="kp-nav" href="/terminos">Términos</a>
            <a className="kp-nav" href="/privacidad">Privacidad</a>
            <a className="kp-nav" href="/docs">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "mic": return <svg {...p}><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" /></svg>;
    case "sliders": return <svg {...p}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>;
    case "time": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "globe": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></svg>;
    case "code": return <svg {...p}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>;
    case "metrics": return <svg {...p}><path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 4-6" /></svg>;
    default: return null;
  }
}
