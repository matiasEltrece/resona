/**
 * Genera los PRESETS latinos de Kyma (voces destacadas, reproducibles por semilla):
 *  - genera cada voz en calidad alta con su SEED fija (design mode),
 *  - la masteriza con el masterizador de Kyma (endpoint Modal: VO EQ + loudnorm 2 pasadas),
 *  - recorta silencios de los extremos con ffmpeg,
 *  - verifica crest factor (si es ruido, reintenta con otra semilla y GUARDA la que funcionó),
 *  - escribe public/radio/presets/<id>.wav  +  lib/presets.json (lo leen la home y el Studio).
 *
 * Uso: node scripts/generate-presets.mjs   (requiere ffmpeg en PATH)
 * Env: OMNIVOICE_ENDPOINT (default = endpoint Kyma)
 *
 * IMPORTANTE: la semilla guardada en presets.json es la que realmente produjo el audio,
 * así seleccionar el preset y generar otro texto reusa el mismo timbre.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const GEN = process.env.OMNIVOICE_ENDPOINT || "https://matiaseltrece--kyma-generate.modal.run";
const MASTER = GEN.replace("kyma-generate", "kyma-master");
const OUT = path.join(process.cwd(), "public", "radio", "presets");
const MANIFEST = path.join(process.cwd(), "lib", "presets.json");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "kyma-presets-"));

// Catálogo latino. Acento: español neutro-latino (OmniVoice no fuerza acento regional por
// instrucción), diferenciado por género/edad/tono + semilla y curado por país.
// tone/energy/clarity = barras de display (0-100).
const PRESETS = [
  // ── Argentina (primeras 3, showcase) ──
  { id: "valentina", name: "Valentina", country: "Argentina", flag: "🇦🇷", char: "cálida",     design: { gender: "female", age: "young_adult", pitch: "moderate" }, seed: 7,   tone: 58, energy: 68, clarity: 90 },
  { id: "bautista",  name: "Bautista",  country: "Argentina", flag: "🇦🇷", char: "locutor",    design: { gender: "male",   age: "young_adult", pitch: "moderate" }, seed: 23,  tone: 46, energy: 62, clarity: 92 },
  { id: "renata",    name: "Renata",    country: "Argentina", flag: "🇦🇷", char: "narradora",  design: { gender: "female", age: "middle_aged", pitch: "low" },      seed: 41,  tone: 40, energy: 50, clarity: 89 },
  // ── México ──
  { id: "mateo",     name: "Mateo",     country: "México",    flag: "🇲🇽", char: "neutra",     design: { gender: "male",   age: "young_adult", pitch: "moderate" }, seed: 58,  tone: 50, energy: 64, clarity: 88 },
  { id: "camila",    name: "Camila",    country: "México",    flag: "🇲🇽", char: "enérgica",   design: { gender: "female", age: "young_adult", pitch: "high" },     seed: 64,  tone: 74, energy: 88, clarity: 86 },
  // ── Colombia ──
  { id: "sebastian", name: "Sebastián", country: "Colombia",  flag: "🇨🇴", char: "profunda",   design: { gender: "male",   age: "middle_aged", pitch: "low" },      seed: 77,  tone: 38, energy: 55, clarity: 90 },
  { id: "mariana",   name: "Mariana",   country: "Colombia",  flag: "🇨🇴", char: "clara",      design: { gender: "female", age: "young_adult", pitch: "moderate" }, seed: 88,  tone: 56, energy: 66, clarity: 91 },
  // ── Chile ──
  { id: "benjamin",  name: "Benjamín",  country: "Chile",     flag: "🇨🇱", char: "serena",     design: { gender: "male",   age: "middle_aged", pitch: "moderate" }, seed: 95,  tone: 48, energy: 56, clarity: 88 },
  { id: "antonia",   name: "Antonia",   country: "Chile",     flag: "🇨🇱", char: "suave",      design: { gender: "female", age: "middle_aged", pitch: "moderate" }, seed: 112, tone: 52, energy: 54, clarity: 89 },
  // ── Uruguay ──
  { id: "thiago",    name: "Thiago",    country: "Uruguay",   flag: "🇺🇾", char: "grave",      design: { gender: "male",   age: "young_adult", pitch: "very_low" }, seed: 130, tone: 32, energy: 52, clarity: 87 },
  // ── Perú ──
  { id: "luciana",   name: "Luciana",   country: "Perú",      flag: "🇵🇪", char: "amable",     design: { gender: "female", age: "young_adult", pitch: "moderate" }, seed: 144, tone: 57, energy: 64, clarity: 90 },
  // ── Venezuela ──
  { id: "gabriel",   name: "Gabriel",   country: "Venezuela", flag: "🇻🇪", char: "cordial",    design: { gender: "male",   age: "middle_aged", pitch: "moderate" }, seed: 160, tone: 50, energy: 60, clarity: 88 },
];

const textFor = (p) => `Hola, soy ${p.name}, de ${p.country}. Esta es mi voz, creada con inteligencia artificial en Kyma.`;

function parseWav(b) { let o = 12; while (o + 8 <= b.length) { const id = b.toString("ascii", o, o + 4); const sz = b.readUInt32LE(o + 4); if (id === "data") return { o: o + 8, len: sz }; o += 8 + sz + (sz % 2); } return null; }
function crest(buf) { const w = parseWav(buf); if (!w) return 0; const end = Math.min(buf.length, w.o + w.len); let peak = 0, s2 = 0, n = 0; for (let i = w.o; i + 1 < end; i += 2) { const s = buf.readInt16LE(i) / 32768; const a = Math.abs(s); if (a > peak) peak = a; s2 += s * s; n++; } const rms = Math.sqrt(s2 / n); return rms < 0.005 ? 0 : peak / rms; }

async function gen(text, design, seed) {
  const r = await fetch(GEN, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: "es", mode: "design", design, quality: "high", seed }) });
  if (!r.ok) throw new Error(`gen ${r.status}`);
  const d = await r.json();
  if (!d.audio_base64) throw new Error("sin audio");
  return Buffer.from(d.audio_base64, "base64");
}
async function master(buf) {
  const r = await fetch(MASTER, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio_base64: buf.toString("base64") }) });
  if (!r.ok) throw new Error(`master ${r.status}`);
  const d = await r.json();
  if (!d.audio_base64) throw new Error("master sin audio");
  return Buffer.from(d.audio_base64, "base64");
}
// recorta silencios de los extremos (no toca loudness, ya viene masterizado)
function trimSilence(inBuf) {
  const raw = path.join(TMP, "raw.wav"), out = path.join(TMP, "out.wav");
  fs.writeFileSync(raw, inBuf);
  const f = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05:detection=peak,areverse," +
            "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05:detection=peak,areverse";
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-af", f, "-ar", "24000", "-ac", "1", "-sample_fmt", "s16", out]);
  return fs.readFileSync(out);
}

fs.mkdirSync(OUT, { recursive: true });
console.log(`Generando ${PRESETS.length} presets latinos…\n`);
const manifest = [];
for (const p of PRESETS) {
  const t0 = Date.now();
  let seed = p.seed, finalBuf = null, finalSeed = seed;
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const trySeed = attempt === 0 ? seed : seed + attempt * 1009;
      const rawWav = await gen(textFor(p), p.design, trySeed);
      const mastered = await master(rawWav);
      const trimmed = trimSilence(mastered);
      const c = crest(trimmed);
      if (c >= 4.5 || attempt === 3) { finalBuf = trimmed; finalSeed = trySeed; if (c < 4.5) console.log(`  ⚠ ${p.id}: crest ${c.toFixed(1)} tras reintentos`); break; }
      console.log(`  ↻ ${p.id}: crest ${c.toFixed(1)} (ruido), reintento`);
    }
    fs.writeFileSync(path.join(OUT, `${p.id}.wav`), finalBuf);
    manifest.push({ id: p.id, name: p.name, country: p.country, flag: p.flag, char: p.char,
      design: p.design, seed: finalSeed, lang: "es", src: `/radio/presets/${p.id}.wav`,
      tone: p.tone, energy: p.energy, clarity: p.clarity });
    console.log(`✓ ${p.name.padEnd(10)} ${p.flag} seed ${String(finalSeed).padEnd(5)} crest ${crest(finalBuf).toFixed(1)}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.error(`✗ ${p.id}: ${e.message}`);
  }
}
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\nListo: ${manifest.length}/${PRESETS.length} presets → public/radio/presets/ + lib/presets.json`);
