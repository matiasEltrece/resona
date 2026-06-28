/**
 * Genera la BIBLIOTECA de voces (matriz sistemática ~100) llamando a OmniVoice (Modal)
 * y deja: public/radio/lib/<id>.wav  +  lib/voice-library.json (manifiesto que lee el Studio).
 *
 * Uso:  node scripts/generate-voice-library.mjs
 * Costo: ~$0.05 el lote (warm ~1.5s c/u). Reutilizable / idempotente.
 */
import fs from "node:fs";
import path from "node:path";

const ENDPOINT = process.env.OMNIVOICE_ENDPOINT || "https://matiaseltrece--kyma-generate.modal.run";
const OUT_WAV = path.join(process.cwd(), "public", "radio", "lib");
const OUT_MANIFEST = path.join(process.cwd(), "lib", "voice-library.json");

const TEXT = {
  es: "Hola, esta es mi voz creada con Kyma.",
  en: "Hi there, this is my voice, made with Kyma.",
  pt: "Olá, esta é a minha voz criada com Kyma.",
  it: "Ciao, questa è la mia voce creata con Kyma.",
  fr: "Bonjour, voici ma voix créée avec Kyma.",
  de: "Hallo, das ist meine mit Kyma erstellte Stimme.",
  ja: "こんにちは、これはKymaで作った私の声です。",
  zh: "你好，这是我用 Kyma 创建的声音。",
  ru: "Привет, это мой голос, созданный с помощью Kyma.",
  ko: "안녕하세요, 이것은 Kyma로 만든 제 목소리입니다.",
};

const FEMALE = ["Aurora","Nova","Sora","Sol","Vera","Iris","Mei","Luna","Carmen","Elena","Mía","Olivia","Clara","Frida","Inés","Lola","Bianca","Noa","Yuki","Anya","Greta","Priya","Zoe","Maya","Alba","Sena","Nadia","Lía","Wren","Hana","Esme","Tara","Vida","Bruna","Cora","Ivy","Suki","Rin","Dália","Soraya","Vesna","Liv","Mara","Chiara","Amara","Selin","Noor","Sofi","Tess","Yara","Indra","Wilma","Pia","Ona","Mira"];
const MALE = ["Atlas","Leo","Bruno","Tomás","Max","Kenji","Dante","Hugo","Marco","Iván","Noah","Diego","Félix","Omar","Ravi","Lars","Pablo","Theo","Hiro","Yusuf","Aldo","Björn","Kai","Samir","Nilo","Cosimo","Dmitri","Enzo","Soren","Tariq","Emil","Vito","Joon","Rafa","Otto","Niko","Gael","Boris","Aarav","Mateo","Sven","Cyrus","Lucca","Anton","Idris","Remy","Pavel","Tian","Hassan","Bram","Caleb","Nael","Ugo","Reza","Milo"];

const AGES = ["child", "teenager", "young_adult", "middle_aged", "elderly"];

function useCase(v) {
  if (v.whisper) return "ASMR";
  if (v.age === "child") return "Infantil";
  if (v.age === "elderly" && (v.pitch === "low" || v.pitch === "very_low")) return "Narración";
  if ((v.age === "young_adult" || v.age === "teenager") && (v.pitch === "high" || v.pitch === "very_high")) return "Enérgica";
  if (v.age === "middle_aged" && (v.pitch === "low" || v.pitch === "very_low")) return "Locución";
  return "Conversacional";
}

const FLAG = { es: "🇦🇷", en: "🇺🇸", pt: "🇧🇷", it: "🇮🇹", fr: "🇫🇷", de: "🇩🇪", ja: "🇯🇵", zh: "🇨🇳", ru: "🇷🇺", ko: "🇰🇷" };
const ACCENT_FLAG = { american: "🇺🇸", british: "🇬🇧", australian: "🇦🇺", indian: "🇮🇳", canadian: "🇨🇦" };

const combos = [];
const add = (c) => combos.push(c);

for (const g of ["female", "male"]) {
  for (const age of AGES) {
    for (const pitch of ["low", "moderate", "high"]) add({ gender: g, age, pitch, lang: "es" });
    for (const pitch of ["very_low", "very_high"]) if (["young_adult", "middle_aged", "elderly"].includes(age)) add({ gender: g, age, pitch, lang: "es" });
  }
  for (const age of ["teenager", "young_adult", "middle_aged"]) add({ gender: g, age, pitch: "moderate", lang: "es", whisper: true });
  for (const accent of ["american", "british", "australian", "indian", "canadian"]) {
    for (const age of ["young_adult", "middle_aged"]) add({ gender: g, age, pitch: "moderate", lang: "en", accent });
  }
  for (const lang of ["pt", "it", "fr", "de", "ja", "zh", "ru", "ko"]) {
    for (const age of ["young_adult", "middle_aged"]) add({ gender: g, age, pitch: "moderate", lang });
  }
}

let fi = 0, mi = 0;
const voices = combos.map((c, idx) => {
  const name = c.gender === "female" ? FEMALE[fi++ % FEMALE.length] : MALE[mi++ % MALE.length];
  const design = { gender: c.gender, age: c.age, pitch: c.pitch };
  if (c.whisper) design.whisper = true;
  if (c.accent) design.accent = c.accent;
  const id = `v${String(idx + 1).padStart(3, "0")}`;
  return { id, name, ...c, design, flag: c.accent ? ACCENT_FLAG[c.accent] : FLAG[c.lang], useCase: useCase(c), file: `/radio/lib/${id}.wav` };
});

console.log(`Matriz: ${voices.length} voces. Generando…`);
fs.mkdirSync(OUT_WAV, { recursive: true });
let ok = 0;
for (const v of voices) {
  const t0 = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: TEXT[v.lang], language: v.lang, mode: "design", design: v.design, quality: "balanced" }),
    });
    if (!res.ok) { console.error(`✗ ${v.id} ${v.name}: ${res.status}`); continue; }
    const d = await res.json();
    if (!d.audio_base64) { console.error(`✗ ${v.id}: sin audio`); continue; }
    fs.writeFileSync(path.join(OUT_WAV, `${v.id}.wav`), Buffer.from(d.audio_base64, "base64"));
    ok++;
    if (ok % 10 === 0) console.log(`  ${ok}/${voices.length}… (${((Date.now() - t0) / 1000).toFixed(1)}s última)`);
  } catch (e) {
    console.error(`✗ ${v.id}: ${e.message}`);
  }
}

const manifest = voices.map(({ id, name, gender, age, pitch, lang, accent = null, whisper = false, flag, useCase: uc, design, file }) =>
  ({ id, name, gender, age, pitch, lang, accent, whisper, flag, useCase: uc, design, file }));
fs.mkdirSync(path.dirname(OUT_MANIFEST), { recursive: true });
fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 0));
console.log(`\nListo: ${ok}/${voices.length} wavs + manifiesto lib/voice-library.json`);
