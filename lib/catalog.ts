/**
 * Catálogo de la UI. OmniVoice soporta 646 idiomas; acá exponemos los ~50
 * más usados con bandera. El parámetro `language` del modelo acepta tanto
 * códigos ISO como el nombre en inglés, así que mandamos el código.
 */
import type {
  Age, Pitch, Accent, ChineseDialect, VoiceDesign,
} from "./inference/types";

export const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "es-AR", label: "Español (Argentina)", flag: "🇦🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "es-MX", label: "Español (México)", flag: "🇲🇽" },
  { code: "en", label: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文 (简体)", flag: "🇨🇳" },
  { code: "zh-TW", label: "中文 (繁體)", flag: "🇹🇼" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "fil", label: "Filipino", flag: "🇵🇭" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
  { code: "yo", label: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
  { code: "am", label: "አማርኛ", flag: "🇪🇹" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "bg", label: "Български", flag: "🇧🇬" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "ca", label: "Català", flag: "🇪🇸" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "sr", label: "Српски", flag: "🇷🇸" },
  { code: "lt", label: "Lietuvių", flag: "🇱🇹" },
];

/** ¿El idioma seleccionado es inglés? (para habilitar acentos) */
export function isEnglish(code: string) {
  return code === "en" || code.startsWith("en-");
}
/** ¿El idioma seleccionado es chino? (para habilitar dialectos) */
export function isChinese(code: string) {
  return code === "zh" || code.startsWith("zh-");
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
