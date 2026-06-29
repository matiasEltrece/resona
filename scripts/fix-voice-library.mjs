/**
 * Repara y MASTERIZA la biblioteca de voces:
 *  - limpia TODOS los wav con ffmpeg (highpass + recorte de silencios + loudnorm -16 LUFS),
 *  - detecta los que son RUIDO (crest factor bajo) y los REGENERA en calidad alta con reintentos,
 *  - si uno sigue siendo ruido tras los reintentos, lo descarta del manifiesto.
 *
 * Uso: node scripts/fix-voice-library.mjs   (requiere ffmpeg en PATH)
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const ENDPOINT = process.env.OMNIVOICE_ENDPOINT || "https://matiaseltrece--kyma-generate.modal.run";
const LIB = path.join(process.cwd(), "public", "radio", "lib");
const MANIFEST = path.join(process.cwd(), "lib", "voice-library.json");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "kyma-fix-"));

const TEXT = {
  es: "Hola, esta es mi voz creada con Kyma.", en: "Hi there, this is my voice, made with Kyma.",
  pt: "Olá, esta é a minha voz criada com Kyma.", it: "Ciao, questa è la mia voce creata con Kyma.",
  fr: "Bonjour, voici ma voix créée avec Kyma.", de: "Hallo, das ist meine mit Kyma erstellte Stimme.",
  ja: "こんにちは、これはKymaで作った私の声です。", zh: "你好，这是我用 Kyma 创建的声音。",
  ru: "Привет, это мой голос, созданный с помощью Kyma.", ko: "안녕하세요, 이것은 Kyma로 만든 제 목소리입니다.",
};

const FILTER = "highpass=f=70," +
  "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:detection=peak,areverse," +
  "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:detection=peak,areverse," +
  "loudnorm=I=-16:TP=-1.5:LRA=11";

function ffmpegClean(inPath, outPath) {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", inPath, "-af", FILTER, "-ar", "24000", "-ac", "1", "-sample_fmt", "s16", outPath]);
}

function parseWav(b) { let off = 12; while (off + 8 <= b.length) { const id = b.toString("ascii", off, off + 4); const sz = b.readUInt32LE(off + 4); if (id === "data") return { o: off + 8, len: sz }; off += 8 + sz + (sz % 2); } return null; }

/** crest factor (peak/RMS): voz > ~6, ruido < ~4. */
function crest(buf) {
  const w = parseWav(buf); if (!w) return 0;
  const end = Math.min(buf.length, w.o + w.len); let peak = 0, sum2 = 0, n = 0;
  for (let i = w.o; i + 1 < end; i += 2) { const s = buf.readInt16LE(i) / 32768; const a = Math.abs(s); if (a > peak) peak = a; sum2 += s * s; n++; }
  const rms = Math.sqrt(sum2 / n); return rms < 0.005 ? 0 : peak / rms;
}

async function genWav(design, lang, seed) {
  const res = await fetch(ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: TEXT[lang] || TEXT.es, language: lang, mode: "design", design, quality: "high", seed }),
  });
  if (!res.ok) throw new Error(`gen ${res.status}`);
  const d = await res.json();
  if (!d.audio_base64) throw new Error("sin audio");
  return Buffer.from(d.audio_base64, "base64");
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const kept = [], dropped = [];
let cleaned = 0, regen = 0;

for (const v of manifest) {
  const file = path.join(LIB, `${v.id}.wav`);
  const raw = path.join(TMP, "raw.wav"), out = path.join(TMP, "out.wav");
  try {
    // 1) limpiar el existente
    fs.copyFileSync(file, raw);
    ffmpegClean(raw, out);
    let buf = fs.readFileSync(out);
    let c = crest(buf);
    // 2) si es ruido, regenerar (alta calidad) con reintentos
    if (c < 4.2) {
      let fixed = false;
      for (let attempt = 1; attempt <= 3 && !fixed; attempt++) {
        const seed = 1000 + v.id.replace(/\D/g, "") * 1 + attempt * 97;
        const g = await genWav(v.design, v.lang, seed);
        fs.writeFileSync(raw, g);
        ffmpegClean(raw, out);
        buf = fs.readFileSync(out);
        c = crest(buf);
        if (c >= 4.2) { fixed = true; regen++; }
      }
      if (!fixed) { dropped.push(`${v.id} ${v.name} (crest ${c.toFixed(1)})`); continue; }
    } else { cleaned++; }
    fs.writeFileSync(file, buf);
    kept.push(v);
  } catch (e) {
    dropped.push(`${v.id} ${v.name} (${e.message})`);
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(kept, null, 0));
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`Limpiadas ${cleaned} · regeneradas ${regen} · descartadas ${dropped.length} → ${kept.length} voces.`);
dropped.forEach((d) => console.log("  ✗ " + d));
