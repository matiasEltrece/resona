/**
 * Watermark de audio INAUDIBLE para el audio del plan FREE.
 *
 * Suma una secuencia pseudo-aleatoria determinística de muy baja amplitud
 * (~-65 dBFS) sobre el PCM 16-bit del WAV. Es imperceptible al oído pero
 * detectable por correlación con la misma secuencia → traza el origen
 * "free-tier Kyma" y desalienta el uso comercial sin pagar.
 *
 * NOTA: es un watermark v1 (spread-spectrum liviano, server-side, sin modelo).
 * Para robustez fuerte ante recompresión/edición → AudioSeal en GPU (Modal), pendiente.
 */

const WM_AMP = 18; // amplitud sobre int16 (±32767) → ~-65 dBFS, inaudible
const WM_SEED = 0x6b796d61; // "kyma"

/** PRNG determinístico (mulberry32). Misma secuencia siempre → permite detectar. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Aplica el watermark a un WAV en base64 (16-bit PCM). Devuelve base64; si no puede parsear, devuelve el original. */
export function applyInaudibleWatermark(base64Wav: string): string {
  try {
    const buf = Buffer.from(base64Wav, "base64");
    if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return base64Wav;

    let off = 12;
    let dataOff = -1, dataLen = 0, bits = 16;
    while (off + 8 <= buf.length) {
      const id = buf.toString("ascii", off, off + 4);
      const size = buf.readUInt32LE(off + 4);
      if (id === "fmt ") bits = buf.readUInt16LE(off + 22);
      if (id === "data") { dataOff = off + 8; dataLen = size; break; }
      off += 8 + size + (size % 2);
    }
    if (dataOff < 0 || bits !== 16) return base64Wav;

    const rnd = mulberry32(WM_SEED);
    const end = Math.min(buf.length, dataOff + dataLen);
    for (let i = dataOff; i + 1 < end; i += 2) {
      const v = buf.readInt16LE(i);
      let nv = v + Math.round((rnd() * 2 - 1) * WM_AMP);
      if (nv > 32767) nv = 32767; else if (nv < -32768) nv = -32768;
      buf.writeInt16LE(nv, i);
    }
    return buf.toString("base64");
  } catch {
    return base64Wav;
  }
}
