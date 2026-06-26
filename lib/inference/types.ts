/**
 * Contratos compartidos de la capa de inferencia.
 *
 * Esta capa es el corazón "plataforma" del producto: la UI y el backend
 * hablan SIEMPRE con esta interfaz, nunca con un modelo concreto. Hoy hay
 * dos providers (mock + modal/OmniVoice); mañana se enchufan más modelos
 * (imagen, video, música) implementando la misma forma.
 */

export type GenerationMode = "clone" | "design";

export interface VoiceDesign {
  gender: "female" | "male" | "neutral";
  age: "child" | "young" | "adult" | "senior";
  pitch: "low" | "medium" | "high";
  style: "neutral" | "expressive" | "whisper" | "narration";
  emotion: "neutral" | "happy" | "sad" | "angry" | "calm";
}

export interface GenerateRequest {
  text: string;
  language: string; // código BCP-47-ish, ej "es", "en", "ja"
  mode: GenerationMode;
  /** Para mode = "design" */
  design?: VoiceDesign;
  /** Para mode = "clone": audio de referencia en base64 (data URL o crudo) */
  referenceAudioBase64?: string;
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
