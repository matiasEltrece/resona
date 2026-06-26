import type {
  GenerateRequest,
  GenerateResult,
  InferenceProvider,
} from "./types";

/**
 * Provider MODAL — habla con el endpoint de OmniVoice que vas a desplegar
 * en Modal/RunPod (ver carpeta /gpu).
 *
 * NO requiere cambios de código para activarse: seteás en .env
 *   INFERENCE_PROVIDER=modal
 *   OMNIVOICE_ENDPOINT=https://<tu-endpoint>.modal.run
 *   OMNIVOICE_API_KEY=<token>   (opcional, según cómo protejas el endpoint)
 *
 * El contrato del endpoint está documentado en /gpu/modal_app.py.
 */
export class ModalProvider implements InferenceProvider {
  readonly id = "modal";
  readonly isReal = true;

  constructor(
    private endpoint = process.env.OMNIVOICE_ENDPOINT,
    private apiKey = process.env.OMNIVOICE_API_KEY,
  ) {}

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    if (!this.endpoint) {
      throw new Error(
        "OMNIVOICE_ENDPOINT no está configurado. Desplegá la GPU (ver /gpu) o usá INFERENCE_PROVIDER=mock.",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 270_000); // 4.5 min

    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          text: req.text,
          language: req.language,
          mode: req.mode,
          design: req.design,
          reference_audio: req.referenceAudioBase64,
          reference_text: req.referenceText,
          speed: req.speed,
          duration_sec: req.durationSec,
          quality: req.quality,
          seed: req.seed,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error("El modelo tardó demasiado. Intentá de nuevo — el próximo request será más rápido.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OmniVoice endpoint error ${res.status}: ${detail}`);
    }

    const data = (await res.json()) as {
      audio_base64: string;
      mime?: string;
      duration_ms?: number;
      rtf?: number;
    };

    return {
      audioBase64: data.audio_base64,
      mime: data.mime ?? "audio/wav",
      durationMs: data.duration_ms ?? 0,
      rtf: data.rtf ?? 0.025,
      provider: this.id,
      isReal: true,
    };
  }
}
