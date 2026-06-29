/**
 * Watermark de audio INAUDIBLE para el audio del plan FREE + su detector.
 *
 * Embebe (applyInaudibleWatermark) una secuencia pseudo-aleatoria determinística
 * de muy baja amplitud (~-58 dBFS) sobre el PCM 16-bit del WAV: imperceptible al
 * oído, pero detectable (detectWatermark) por correlación normalizada contra la
 * misma secuencia → traza el origen "free-tier Kyma".
 *
 * v1: spread-spectrum liviano, server-side, sin modelo. Frágil a recompresión
 * fuerte / trimming. Upgrade robusto = AudioSeal en GPU (Modal), pendiente.
 */

const WM_AMP = 48;          // amplitud sobre int16 (±32767) → ~-60 dBFS, inaudible
const WM_SEED = 0x6b796d61; // "kyma"

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Localiza el chunk PCM 16-bit del WAV. */
function parseWav(buf: Buffer): { dataOff: number; dataLen: number } | null {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return null;
  let off = 12, bits = 16;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") bits = buf.readUInt16LE(off + 22);
    if (id === "data") return bits === 16 ? { dataOff: off + 8, dataLen: size } : null;
    off += 8 + size + (size % 2);
  }
  return null;
}

/** Aplica el watermark a un WAV base64. Devuelve base64; si no puede parsear, el original. */
export function applyInaudibleWatermark(base64Wav: string): string {
  try {
    const buf = Buffer.from(base64Wav, "base64");
    const w = parseWav(buf);
    if (!w) return base64Wav;
    const rnd = mulberry32(WM_SEED);
    const end = Math.min(buf.length, w.dataOff + w.dataLen);
    for (let i = w.dataOff; i + 1 < end; i += 2) {
      let nv = buf.readInt16LE(i) + Math.round((rnd() * 2 - 1) * WM_AMP);
      if (nv > 32767) nv = 32767; else if (nv < -32768) nv = -32768;
      buf.writeInt16LE(nv, i);
    }
    return buf.toString("base64");
  } catch {
    return base64Wav;
  }
}

/**
 * Detecta el watermark por correlación normalizada contra la secuencia conocida,
 * con pre-filtro PASA-ALTOS (diferencia primera): la marca es banda ancha y la voz
 * no, así que diferenciar atenúa la voz y deja la marca → mucho mejor separación.
 * Devuelve score, umbral estadístico adaptativo y veredicto.
 */
export function detectWatermark(base64Wav: string): { present: boolean; score: number; threshold: number; samples: number } {
  try {
    const buf = Buffer.from(base64Wav, "base64");
    const w = parseWav(buf);
    if (!w) return { present: false, score: 0, threshold: 0, samples: 0 };
    const rnd = mulberry32(WM_SEED);
    const end = Math.min(buf.length, w.dataOff + w.dataLen);
    let pa: number | null = null, pr = 0, dot = 0, ea = 0, er = 0, n = 0;
    for (let i = w.dataOff; i + 1 < end; i += 2) {
      const a = buf.readInt16LE(i);
      const r = rnd() * 2 - 1;
      if (pa !== null) {
        const ha = a - pa, hr = r - pr; // diferencia primera (pasa-altos)
        dot += ha * hr; ea += ha * ha; er += hr * hr; n++;
      }
      pa = a; pr = r;
    }
    const score = ea > 0 && er > 0 ? dot / Math.sqrt(ea * er) : 0;
    const threshold = n > 0 ? 4 / Math.sqrt(n) : 1; // ~4σ sobre el ruido esperado
    return { present: score > threshold, score: Math.round(score * 1e5) / 1e5, threshold: Math.round(threshold * 1e5) / 1e5, samples: n };
  } catch {
    return { present: false, score: 0, threshold: 0, samples: 0 };
  }
}
