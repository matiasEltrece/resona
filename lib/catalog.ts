/**
 * Catálogo de la UI. OmniVoice soporta 600+ idiomas; acá exponemos una
 * selección representativa para la demo. La lista completa se carga del
 * modelo real cuando esté conectado.
 */
export const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "es-AR", label: "Español (Argentina)", flag: "🇦🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];

export const VOICE_PRESETS = [
  {
    id: "aurora",
    name: "Aurora",
    desc: "Femenina · cálida · narración",
    design: { gender: "female", age: "adult", pitch: "medium", style: "narration", emotion: "calm" },
  },
  {
    id: "atlas",
    name: "Atlas",
    desc: "Masculina · grave · documental",
    design: { gender: "male", age: "adult", pitch: "low", style: "narration", emotion: "neutral" },
  },
  {
    id: "nova",
    name: "Nova",
    desc: "Neutra · joven · expresiva",
    design: { gender: "neutral", age: "young", pitch: "high", style: "expressive", emotion: "happy" },
  },
  {
    id: "echo",
    name: "Echo",
    desc: "Susurro · íntimo · ASMR",
    design: { gender: "female", age: "young", pitch: "medium", style: "whisper", emotion: "calm" },
  },
] as const;

export const SAMPLE_SCRIPTS = [
  "Hola, soy una voz creada con inteligencia artificial. Puedo hablar en más de 600 idiomas.",
  "Bienvenidos a un nuevo episodio. Hoy vamos a hablar de algo que va a cambiar la forma en que creás contenido.",
  "This is my voice, cloned in seconds and speaking a language I never learned.",
];
