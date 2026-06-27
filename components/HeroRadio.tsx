"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Voice {
  name: string; char: string; lang: string; flag: string; glow: string; src: string;
}

const VOICES: Voice[] = [
  { name: "Aurora", char: "cálida",       lang: "ES-AR", flag: "🇦🇷", glow: "rgba(217,70,239,0.42)", src: "/radio/aurora.wav" },
  { name: "Atlas",  char: "profunda",     lang: "EN-GB", flag: "🇬🇧", glow: "rgba(124,92,255,0.44)", src: "/radio/atlas.wav" },
  { name: "Nova",   char: "enérgica",     lang: "PT-BR", flag: "🇧🇷", glow: "rgba(34,211,238,0.42)", src: "/radio/nova.wav" },
  { name: "Sora",   char: "suave",        lang: "JA",    flag: "🇯🇵", glow: "rgba(124,92,255,0.36)", src: "/radio/sora.wav" },
  { name: "Echo",   char: "suave",        lang: "ES",    flag: "🇪🇸", glow: "rgba(34,211,238,0.34)", src: "/radio/echo.wav" },
  { name: "Leo",    char: "narrador",     lang: "IT",    flag: "🇮🇹", glow: "rgba(217,70,239,0.38)", src: "/radio/leo.wav" },
];

export default function HeroRadio() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const curRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const indexRef = useRef(0);

  indexRef.current = index;
  playingRef.current = playing;

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
    sourceRef.current = source;
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

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

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

  // Auto-avanza a la siguiente voz al terminar (efecto radio en loop)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnded = () => select(indexRef.current + 1);
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [select]);

  // Con el sonido apagado, la radio "escanea" estaciones sola (queda viva)
  useEffect(() => {
    if (playing) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % VOICES.length), 5000);
    return () => clearInterval(id);
  }, [playing]);

  // Loop de dibujo del ecualizador (FFT real)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

    let grad: CanvasGradient | null = null;
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.clearRect(0, 0, W, H);
      const N = 52;
      if (curRef.current.length !== N) curRef.current = new Array(N).fill(0.04);
      const targets = new Array(N).fill(0);
      const half = Math.ceil(N / 2);
      const isPlaying = playingRef.current;
      const analyser = analyserRef.current, freq = freqRef.current;
      if (isPlaying && analyser && freq) {
        analyser.getByteFrequencyData(freq);
        const usable = Math.floor(freq.length * 0.55);
        for (let j = 0; j < half; j++) {
          const idx = Math.floor((j / half) * usable);
          let v = freq[idx] / 255; v = Math.pow(v, 0.85);
          targets[half - 1 - j] = v;
          const ri = Math.min(N - 1, half - 1 + j);
          targets[ri] = Math.max(targets[ri], v);
        }
      } else {
        const t = performance.now() / 1000;
        for (let n = 0; n < N; n++) {
          const c = 1 - Math.abs(n - (N - 1) / 2) / ((N - 1) / 2);
          targets[n] = 0.035 + 0.045 * Math.max(0, c) * (0.6 + 0.4 * Math.sin(t * 1.4 + n * 0.35));
        }
      }
      for (let n = 0; n < N; n++) {
        const sp = isPlaying ? 0.4 : 0.08;
        curRef.current[n] += (targets[n] - curRef.current[n]) * sp;
      }
      if (!grad) {
        grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#22d3ee"); grad.addColorStop(0.5, "#7c5cff"); grad.addColorStop(1, "#22d3ee");
      }
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(217,70,239,0.45)";
      ctx.shadowBlur = 7;
      const slot = W / N, barW = Math.max(2, slot * 0.62), midY = H / 2, maxH = H * 0.94;
      for (let n = 0; n < N; n++) {
        const h = Math.max(3, curRef.current[n] * maxH);
        const x = n * slot + (slot - barW) / 2, y = midY - h / 2, r = Math.min(barW / 2, 3);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barW, h, r); else ctx.rect(x, y, barW, h);
        ctx.fill();
      }
    };
    draw();
    return () => {
      window.removeEventListener("resize", sizeCanvas);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const v = VOICES[index];

  return (
    <section className="relative max-w-[1120px] mx-auto px-7 pt-[84px] pb-10 text-center">
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />

      <h1 className="fade-up mx-auto max-w-[920px] font-extrabold leading-[1.04]"
        style={{ fontSize: "clamp(48px,7.2vw,88px)", letterSpacing: "-0.025em" }}>
        Cualquier voz.<br />
        <span className="text-gradient">Cualquier idioma.</span>
      </h1>

      <p className="fade-up mx-auto mt-[26px] max-w-[580px] text-[length:var(--text-lg)] leading-[1.6]" style={{ color: "var(--text-secondary)" }}>
        Cloná, diseñá y generá voces con IA en 646 idiomas. Grabá 10 segundos
        y replicá tu voz en segundos. Sin estudio, sin GPU.
      </p>

      <div className="fade-up mt-[34px] flex gap-[14px] justify-center flex-wrap">
        <a href="#studio" className="btn-accent rounded-full font-semibold inline-flex items-center px-7" style={{ height: 52 }}>
          Probalo gratis — sin registro
        </a>
        <button onClick={toggle} className="glass glass-hover rounded-full font-semibold inline-flex items-center px-7" style={{ height: 52 }}>
          {playing ? "⏸ Pausar" : "▶ Escuchar voces"}
        </button>
      </div>
      <p className="fade-up mt-4 text-[length:var(--text-xs)]" style={{ color: "var(--text-muted)" }}>
        10.000 caracteres gratis al mes · Cancelás cuando quieras
      </p>

      {/* ── Reproductor de voces ── */}
      <div className="relative w-full max-w-[920px] mx-auto mt-[50px]">
        {/* Toggle de volumen (default apagado; activa el sonido en loop) */}
        <button
          onClick={toggle}
          aria-label={playing ? "Silenciar voces" : "Activar sonido"}
          className="absolute top-0 right-0 z-[3] glass glass-hover rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, color: playing ? "var(--text-primary)" : "var(--text-secondary)" }}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
          )}
        </button>

        <div className="absolute pointer-events-none" style={{
          left: "50%", top: "40%", transform: "translate(-50%,-50%)", width: "78%", height: 300,
          background: `radial-gradient(56% 60% at 50% 50%, ${v.glow}, rgba(124,92,255,0.12) 48%, transparent 72%)`,
          filter: "blur(54px)", zIndex: 0, transition: "background 0.6s ease",
        }} />

        <div className="relative z-[2]" style={{ height: 222 }}>
          <div className="absolute left-0 right-0" style={{ top: "50%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)" }} />
          <canvas ref={canvasRef} className="block w-full h-full" />
        </div>

        <div className="relative z-[2] mt-[14px] flex flex-col items-center gap-[9px]">
          <div className="inline-flex items-center gap-[11px]">
            <span className="font-bold" style={{ fontSize: 28, letterSpacing: "-0.01em" }}>{v.name}</span>
            <span style={{ fontSize: 19, lineHeight: 1 }}>{v.flag}</span>
          </div>
          <div className="inline-flex items-center gap-[10px] text-[length:var(--text-sm)]" style={{ color: "var(--text-secondary)" }}>
            <span className="rounded-full px-[11px] py-[3px]" style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}>{v.char}</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{v.lang}</span>
          </div>
        </div>

        <div className="relative z-[2] mt-5 flex items-center justify-center gap-[22px]">
          <button onClick={prev} aria-label="Voz anterior" className="glass glass-hover rounded-full flex items-center justify-center" style={{ width: 46, height: 46, color: "var(--text-secondary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button onClick={toggle} aria-label="Reproducir / pausar" className="rounded-full flex items-center justify-center text-white" style={{ width: 68, height: 68, background: "var(--brand-gradient-2)", boxShadow: "var(--shadow-accent)" }}>
            {playing ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button onClick={next} aria-label="Voz siguiente" className="glass glass-hover rounded-full flex items-center justify-center" style={{ width: 46, height: 46, color: "var(--text-secondary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div className="relative z-[2] mt-5 flex flex-col items-center gap-[13px]">
          <div className="flex gap-2">
            {VOICES.map((_, k) => (
              <button key={k} onClick={() => select(k)} aria-label="Ir a esta voz" className="rounded-full border-0 cursor-pointer p-0"
                style={{ width: 8, height: 8, background: k === index ? "var(--brand-magenta)" : "var(--glass-border)", boxShadow: k === index ? "0 0 10px var(--glow-magenta)" : "none", transition: "background var(--dur-base)" }} />
            ))}
          </div>
          <span className="inline-flex items-center gap-[7px] text-[length:var(--text-xs)]" style={{ color: "var(--text-muted)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 8px var(--success)" }} />
            Voces generadas con OmniVoice · audio real
          </span>
        </div>
      </div>
    </section>
  );
}
