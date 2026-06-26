/**
 * Catálogo de la UI. Los 646 idiomas canónicos viven en ./languages.ts
 * (generado desde lang_map.py de OmniVoice). Acá re-exportamos + opciones
 * de diseño de voz, tags expresivos y presets.
 */
import type {
  Age, Pitch, Accent, ChineseDialect, VoiceDesign,
} from "./inference/types";

export { LANGUAGES, LANGUAGE_COUNT } from "./languages";
export type { Language } from "./languages";

/** ¿El idioma seleccionado es inglés? (para habilitar acentos) */
export function isEnglish(code: string) {
  return code === "en" || code.startsWith("en-");
}
/** ¿El idioma seleccionado es chino? (para habilitar dialectos) */
export function isChinese(code: string) {
  return code === "zh" || code === "yue" || code === "nan" || code.startsWith("zh-");
}

/* ─── Opciones de diseño de voz (mapean 1:1 con OmniVoice) ─────────────── */

export const GENDER_OPTIONS = [
  { value: "female", label: "Femenina" },
  { value: "male", label: "Masculina" },
] as const;

export const AGE_OPTIONS: { value: Age; label: string }[] = [
  { value: "child", label: "Niño/a" },
  { value: "teenager", label: "Adolescente" },
  { value: "young_adult", label: "Joven adulto" },
  { value: "middle_aged", label: "Mediana edad" },
  { value: "elderly", label: "Mayor" },
];

export const PITCH_OPTIONS: { value: Pitch; label: string }[] = [
  { value: "very_low", label: "Muy grave" },
  { value: "low", label: "Grave" },
  { value: "moderate", label: "Medio" },
  { value: "high", label: "Agudo" },
  { value: "very_high", label: "Muy agudo" },
];

export const ACCENT_OPTIONS: { value: Accent; label: string }[] = [
  { value: "american", label: "Americano" },
  { value: "british", label: "Británico" },
  { value: "australian", label: "Australiano" },
  { value: "canadian", label: "Canadiense" },
  { value: "indian", label: "Indio" },
  { value: "korean", label: "Coreano" },
  { value: "chinese", label: "Chino" },
  { value: "japanese", label: "Japonés" },
  { value: "portuguese", label: "Portugués" },
  { value: "russian", label: "Ruso" },
];

export const DIALECT_OPTIONS: { value: ChineseDialect; label: string }[] = [
  { value: "河南话", label: "Henan" },
  { value: "陕西话", label: "Shaanxi" },
  { value: "四川话", label: "Sichuan" },
  { value: "贵州话", label: "Guizhou" },
  { value: "云南话", label: "Yunnan" },
  { value: "东北话", label: "Noreste (Dongbei)" },
  { value: "桂林话", label: "Guilin" },
  { value: "济南话", label: "Jinan" },
  { value: "石家庄话", label: "Shijiazhuang" },
  { value: "甘肃话", label: "Gansu" },
  { value: "宁夏话", label: "Ningxia" },
  { value: "青岛话", label: "Qingdao" },
];

/* ─── Tags expresivos non-verbales (insertables en el texto) ──────────── */

export const EXPRESSIVE_TAGS: { tag: string; label: string; emoji: string }[] = [
  { tag: "[laughter]", label: "Risa", emoji: "😂" },
  { tag: "[sigh]", label: "Suspiro", emoji: "😮‍💨" },
  { tag: "[surprise-ah]", label: "Sorpresa «ah»", emoji: "😲" },
  { tag: "[surprise-oh]", label: "Sorpresa «oh»", emoji: "😮" },
  { tag: "[surprise-wa]", label: "Sorpresa «wa»", emoji: "🤩" },
  { tag: "[surprise-yo]", label: "Sorpresa «yo»", emoji: "😯" },
  { tag: "[question-en]", label: "Pregunta «¿eh?»", emoji: "🤔" },
  { tag: "[question-ah]", label: "Pregunta «¿ah?»", emoji: "❓" },
  { tag: "[question-oh]", label: "Pregunta «¿oh?»", emoji: "❔" },
  { tag: "[confirmation-en]", label: "Confirmación «ajá»", emoji: "👍" },
  { tag: "[dissatisfaction-hnn]", label: "Disgusto «hmf»", emoji: "😒" },
];

/* ─── Calidad ↔ velocidad ─────────────────────────────────────────────── */

export const QUALITY_OPTIONS = [
  { value: "fast", label: "Rápida", desc: "16 pasos · la más veloz" },
  { value: "balanced", label: "Equilibrada", desc: "24 pasos · recomendada" },
  { value: "high", label: "Alta", desc: "32 pasos · máxima calidad" },
] as const;

/* ─── Presets (valores reales del modelo) ─────────────────────────────── */

export const VOICE_PRESETS: { id: string; name: string; desc: string; design: VoiceDesign }[] = [
  {
    id: "aurora",
    name: "Aurora",
    desc: "Femenina · cálida · narración",
    design: { gender: "female", age: "young_adult", pitch: "moderate" },
  },
  {
    id: "atlas",
    name: "Atlas",
    desc: "Masculina · grave · documental",
    design: { gender: "male", age: "middle_aged", pitch: "low" },
  },
  {
    id: "nova",
    name: "Nova",
    desc: "Femenina · joven · enérgica",
    design: { gender: "female", age: "teenager", pitch: "high" },
  },
  {
    id: "echo",
    name: "Echo",
    desc: "Femenina · susurro · ASMR",
    design: { gender: "female", age: "young_adult", pitch: "moderate", whisper: true },
  },
  {
    id: "sage",
    name: "Sage",
    desc: "Masculina · mayor · sabio",
    design: { gender: "male", age: "elderly", pitch: "very_low" },
  },
  {
    id: "pixel",
    name: "Pixel",
    desc: "Infantil · agudo · juguetón",
    design: { gender: "female", age: "child", pitch: "very_high" },
  },
];

export const SAMPLE_SCRIPTS = [
  "Hola, soy una voz creada con inteligencia artificial. Puedo hablar en más de 600 idiomas.",
  "Bienvenidos a un nuevo episodio. Hoy vamos a hablar de algo que va a cambiar la forma en que creás contenido. [laughter]",
  "This is my voice, cloned in seconds and speaking a language I never learned.",
];
