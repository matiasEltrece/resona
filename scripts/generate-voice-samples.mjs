/**
 * Genera los samples de la galería de voces del Studio llamando al endpoint
 * de OmniVoice (Modal) y los guarda en public/radio/<file>.wav.
 *
 * Uso:  node scripts/generate-voice-samples.mjs
 * Env:  OMNIVOICE_ENDPOINT (default = endpoint Kyma), OMNIVOICE_API_KEY (opcional)
 *
 * Costo: ~$0.04-0.06 el lote entero (una sola vez). Reusable para sumar voces.
 */
import fs from "node:fs";
import path from "node:path";

const ENDPOINT = process.env.OMNIVOICE_ENDPOINT || "https://matiaseltrece--kyma-generate.modal.run";
const KEY = process.env.OMNIVOICE_API_KEY || "";
const OUT = path.join(process.cwd(), "public", "radio");

const TEXT = {
  es: "Hola, esta es mi voz creada con Kyma.",
  en: "Hi there, this is my voice, made with Kyma.",
  ja: "こんにちは、これは私の声です。",
  zh: "你好，这是我用 Kyma 创建的声音。",
  it: "Ciao, questa è la mia voce creata con Kyma.",
  pt: "Olá, esta é a minha voz criada com Kyma.",
};

const VOICES = [
  { file: "sol",    lang: "es", design: { gender: "female", age: "child",       pitch: "high" } },
  { file: "bruno",  lang: "es", design: { gender: "male",   age: "young_adult", pitch: "moderate" } },
  { file: "vera",   lang: "es", design: { gender: "female", age: "elderly",     pitch: "low" } },
  { file: "tomas",  lang: "es", design: { gender: "male",   age: "middle_aged", pitch: "moderate" } },
  { file: "max",    lang: "en", design: { gender: "male",   age: "young_adult", pitch: "high", accent: "american" } },
  { file: "iris",   lang: "en", design: { gender: "female", age: "middle_aged", pitch: "moderate", accent: "british" } },
  { file: "olivia", lang: "en", design: { gender: "female", age: "young_adult", pitch: "moderate", whisper: true } },
  { file: "kenji",  lang: "ja", design: { gender: "male",   age: "middle_aged", pitch: "low" } },
  { file: "mei",    lang: "zh", design: { gender: "female", age: "young_adult", pitch: "high" } },
  { file: "dante",  lang: "it", design: { gender: "male",   age: "elderly",     pitch: "very_low" } },
];

fs.mkdirSync(OUT, { recursive: true });
let ok = 0;
for (const v of VOICES) {
  const t0 = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}) },
      body: JSON.stringify({ text: TEXT[v.lang], language: v.lang, mode: "design", design: v.design, quality: "balanced" }),
    });
    if (!res.ok) { console.error(`✗ ${v.file}: ${res.status} ${(await res.text()).slice(0, 120)}`); continue; }
    const d = await res.json();
    if (!d.audio_base64) { console.error(`✗ ${v.file}: sin audio`); continue; }
    fs.writeFileSync(path.join(OUT, `${v.file}.wav`), Buffer.from(d.audio_base64, "base64"));
    console.log(`✓ ${v.file.padEnd(8)} ${((Date.now() - t0) / 1000).toFixed(1)}s  ${(d.duration_ms || 0)}ms`);
    ok++;
  } catch (e) {
    console.error(`✗ ${v.file}: ${e.message}`);
  }
}
console.log(`\nListo: ${ok}/${VOICES.length} samples en public/radio/`);
