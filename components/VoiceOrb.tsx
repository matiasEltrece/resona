"use client";

import { useEffect, useRef } from "react";

/* Visualizador radial FFT dorado (el mismo de la home). Reacciona al audio
   cuando `playing` y hay `analyser`; si no, late en idle. Reusable. */
export default function VoiceOrb({ analyser, playing, height = 190 }: { analyser: AnalyserNode | null; playing: boolean; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const playingRef = useRef(playing);
  const analyserRef = useRef<AnalyserNode | null>(analyser);
  playingRef.current = playing;
  analyserRef.current = analyser;

  useEffect(() => {
    if (analyser) freqRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  }, [analyser]);

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
    let grad: CanvasGradient | null = null;
    const onResize = () => { sizeCanvas(); grad = null; };
    window.addEventListener("resize", onResize);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      if (Math.abs(rect.width * dpr - canvas.width) > 2 || Math.abs(rect.height * dpr - canvas.height) > 2) { sizeCanvas(); grad = null; }
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const N = 64;
      if (curRef.current.length !== N) curRef.current = new Array(N).fill(0.08);
      const targets = new Array(N).fill(0);
      const half = Math.floor(N / 2);
      const isPlaying = playingRef.current;
      const analyserNow = analyserRef.current, freq = freqRef.current;
      if (isPlaying && analyserNow && freq) {
        analyserNow.getByteFrequencyData(freq);
        const usable = Math.floor(freq.length * 0.6);
        for (let n = 0; n < N; n++) {
          const j = n <= half ? n : N - n;
          const idx = Math.floor((j / half) * usable);
          let v = freq[idx] / 255; v = Math.pow(v, 0.82);
          targets[n] = v;
        }
      } else {
        const t = performance.now() / 1000;
        for (let n = 0; n < N; n++) targets[n] = 0.10 + 0.055 * (0.5 + 0.5 * Math.sin(t * 1.1 + n * 0.5));
      }
      for (let n = 0; n < N; n++) {
        const sp = isPlaying ? 0.45 : 0.06;
        curRef.current[n] += (targets[n] - curRef.current[n]) * sp;
      }
      const R = Math.min(W, H);
      const baseR = R * 0.205, maxLen = R * 0.235;
      const glowCol = "rgba(199,154,69,0.55)";
      const centerCol = "rgba(210,166,79,0.20)";
      const ringCol = "rgba(210,166,79,0.24)";
      const tt = performance.now() / 1000;

      const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.2);
      gg.addColorStop(0, centerCol); gg.addColorStop(1, "transparent");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, baseR * 1.2, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = ringCol; ctx.lineWidth = 1;
      [0.46, 0.7].forEach((f, k) => {
        const rr = baseR * f + Math.sin(tt * 1.3 + k * 1.7) * (isPlaying ? 4 : 2);
        ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;

      if (!grad) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#e3b94f"); g.addColorStop(0.5, "#c2902f"); g.addColorStop(1, "#8a6322");
        grad = g;
      }
      ctx.strokeStyle = grad; ctx.lineCap = "round";
      ctx.shadowColor = glowCol; ctx.shadowBlur = 6;
      const bw = Math.max(2, (2 * Math.PI * baseR / N) * 0.5);

      ctx.lineWidth = bw;
      for (let n = 0; n < N; n++) {
        const a = -Math.PI / 2 + (n / N) * Math.PI * 2;
        const len = Math.max(3, curRef.current[n] * maxLen);
        const ca = Math.cos(a), sa = Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(cx + ca * baseR, cy + sa * baseR);
        ctx.lineTo(cx + ca * (baseR + len), cy + sa * (baseR + len));
        ctx.stroke();
      }

      ctx.shadowBlur = 0; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(1.5, bw * 0.7);
      for (let n = 0; n < N; n++) {
        const a = -Math.PI / 2 + (n / N) * Math.PI * 2;
        const innerLen = Math.max(2, curRef.current[n] * maxLen * 0.5);
        const r1 = baseR - 5, r2 = Math.max(R * 0.05, baseR - 5 - innerLen);
        const ca = Math.cos(a), sa = Math.sin(a);
        ctx.beginPath(); ctx.moveTo(cx + ca * r1, cy + sa * r1); ctx.lineTo(cx + ca * r2, cy + sa * r2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    draw();
    return () => { window.removeEventListener("resize", onResize); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return <div style={{ width: "100%", height }}><canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} /></div>;
}
