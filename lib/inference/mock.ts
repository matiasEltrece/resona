import type {
  GenerateRequest,
  GenerateResult,
  InferenceProvider,
} from "./types";

/**
 * Provider MOCK — funciona sin GPU.
 *
 * Sintetiza un WAV real (un arpegio suave) cuya duración escala con el largo
 * del texto y cuyo timbre varía según la voz elegida, para que el flujo
 * completo (generar → reproducir → descargar) se sienta real en la demo.
 *
 * Cuando tengas la GPU, no se toca nada de esto: cambiás INFERENCE_PROVIDER
 * a "modal" en .env y el sistema usa OmniVoice de verdad.
 */

const SAMPLE_RATE = 22050;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): Buffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // audio format = PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE((s < 0 ? s * 0x8000 : s * 0x7fff) | 0, 44 + i * 2);
  }
  return buffer;
}

export class MockProvider implements InferenceProvider {
  readonly id = "mock";
  readonly isReal = false;

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const seed = req.seed ?? hashString(req.text + req.language + req.mode);

    // Duración ~ largo del texto (acotada 1.5s..8s), ajustada por speed
    const words = req.text.trim().split(/\s+/).filter(Boolean).length || 1;
    const speed = req.speed && req.speed > 0 ? req.speed : 1;
    const rawDuration = req.durationSec ?? Math.min(8, Math.max(1.5, words * 0.35)) / speed;
    const durationSec = Math.min(20, Math.max(1, rawDuration));
    const n = Math.floor(durationSec * SAMPLE_RATE);
    const samples = new Float32Array(n);

    // Tónica según semilla / voz
    const base = 196 + (seed % 7) * 24; // ~G3..
    const scale = [0, 2, 4, 7, 9, 12]; // pentatónica mayor agradable
    const isWhisper = req.design?.whisper === true;

    const notePeriod = Math.floor(SAMPLE_RATE * 0.32);
    for (let i = 0; i < n; i++) {
      const noteIdx = Math.floor(i / notePeriod) % scale.length;
      const freq = base * Math.pow(2, scale[noteIdx] / 12);
      const t = i / SAMPLE_RATE;
      // envolvente por nota
      const local = (i % notePeriod) / notePeriod;
      const env = Math.sin(Math.PI * local) ** 1.5;
      let v =
        0.5 * Math.sin(2 * Math.PI * freq * t) +
        0.25 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.12 * Math.sin(2 * Math.PI * freq * 3 * t);
      if (isWhisper) {
        // mezcla de ruido para simular susurro
        v = 0.4 * v + 0.6 * (Math.random() * 2 - 1) * env;
      }
      samples[i] = v * env * 0.5;
    }

    const wav = encodeWav(samples);

    // pequeña latencia simulada para que la UI muestre el estado "generando"
    await new Promise((r) => setTimeout(r, 350));

    return {
      audioBase64: wav.toString("base64"),
      mime: "audio/wav",
      durationMs: Math.round(durationSec * 1000),
      rtf: 0.025,
      provider: this.id,
      isReal: false,
    };
  }
}
