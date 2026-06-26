/**
 * Contratos compartidos de la capa de inferencia.
 *
 * Esta capa es el corazón "plataforma" del producto: la UI y el backend
 * hablan SIEMPRE con esta interfaz, nunca con un modelo concreto. Hoy hay
 * dos providers (mock + modal/OmniVoice); mañana se enchufan más modelos
 * (imagen, video, música) implementando la misma forma.
 *
 * El diseño de voz mapea 1:1 con lo que OmniVoice realmente acepta en su
 * parámetro `instruct` (ver omnivoice/utils/voice_design.py). Nada se inventa.
 */

export type GenerationMode = "clone" | "design";

/** Géneros que OmniVoice acepta (no hay "neutral" en el modelo). */
export type Gender = "female" | "male";

/** Edades reales del modelo. */
export type Age = "child" | "teenager" | "young_adult" | "middle_aged" | "elderly";

/** Tonos reales del modelo. */
export type Pitch = "very_low" | "low" | "moderate" | "high" | "very_high";

/** Acentos del inglés (solo válidos cuando language = inglés). */
export type Accent =
  | "american"
  | "british"
  | "australian"
  | "canadian"
  | "indian"
  | "korean"
  | "chinese"
  | "japanese"
  | "portuguese"
  | "russian";

/** Dialectos del chino (solo válidos cuando language = chino). */
export type ChineseDialect =
  | "河南话" | "陕西话" | "四川话" | "贵州话" | "云南话" | "桂林话"
  | "济南话" | "石家庄话" | "甘肃话" | "宁夏话" | "青岛话" | "东北话";

export interface VoiceDesign {
  gender: Gender;
  age: Age;
  pitch: Pitch;
  /** Estilo susurro — el único "style" que OmniVoice soporta. */
  whisper?: boolean;
  /** Acento del inglés (opcional, solo si el idioma es inglés). */
  accent?: Accent;
  /** Dialecto chino (opcional, solo si el idioma es chino). */
  dialect?: ChineseDialect;
}

/** Calidad ↔ velocidad de inferencia (num_step del modelo). */
export type Quality = "fast" | "balanced" | "high";

export interface GenerateRequest {
  text: string;
  language: string; // código BCP-47-ish o nombre, ej "es", "en", "ja"
  mode: GenerationMode;
  /** Para mode = "design" */
  design?: VoiceDesign;
  /** Para mode = "clone": audio de referencia en base64 (data URL o crudo) */
  referenceAudioBase64?: string;
  /** Transcripción del audio de referencia (opcional, mejora la clonación). */
  referenceText?: string;
  /** Factor de velocidad de habla 0.5 (lento) .. 2.0 (rápido). Default 1.0 */
  speed?: number;
  /** Duración fija de salida en segundos (opcional, sobrescribe speed). */
  durationSec?: number;
  /** Calidad de inferencia (num_step). Default "balanced". */
  quality?: Quality;
  /** Semilla opcional para reproducibilidad */
  seed?: number;
}

export interface GenerateResult {
  /** Audio resultante en base64 (sin prefijo data:) */
  audioBase64: string;
  mime: string; // ej "audio/wav"
  durationMs: number;
  /** Real-time factor reportado por el modelo (cómputo/seg de audio) */
  rtf: number;
  provider: string;
  /** true si vino de un modelo real; false si es placeholder local */
  isReal: boolean;
}

export interface InferenceProvider {
  readonly id: string;
  /** ¿Está apuntando a un modelo real o es un stub local? */
  readonly isReal: boolean;
  generate(req: GenerateRequest): Promise<GenerateResult>;
}
