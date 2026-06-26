import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/inference";
import type { GenerateRequest } from "@/lib/inference";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateApiKey, extractKey, type ApiKeyAuth } from "@/lib/api-keys";

export const runtime = "nodejs";
export const maxDuration = 300;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-api-key",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function err(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status, headers: CORS });
}

/**
 * POST /api/v1/generate — API pública de Kyma (TTS).
 * Auth: header `Authorization: Bearer kyma_sk_...` o `x-api-key`.
 *
 * Body (JSON):
 * {
 *   "text": "Hola [laughter] mundo",        // requerido
 *   "language": "es",                         // default "es"
 *   "mode": "design" | "clone",               // default "design"
 *   "design": { gender, age, pitch, whisper, accent, dialect },
 *   "referenceAudioBase64": "<base64>",       // para mode=clone
 *   "referenceText": "transcripción",         // opcional
 *   "speed": 1.0, "durationSec": null,
 *   "quality": "fast" | "balanced" | "high",
 *   "seed": 42
 * }
 *
 * 200 → { audioBase64, mime, durationMs, rtf, provider }
 */
export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const key = extractKey(req);
  if (!key) return err("Falta la API key. Usá el header 'Authorization: Bearer kyma_sk_...'", 401, "no_key");

  let auth: ApiKeyAuth | null;
  try {
    auth = await authenticateApiKey(key);
  } catch {
    return err("Error validando la API key", 500, "auth_error");
  }
  if (!auth) return err("API key inválida o revocada", 401, "invalid_key");

  // ── Body ────────────────────────────────────────────────────────────────
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return err("JSON inválido", 400, "bad_json");
  }
  if (!body.text || body.text.trim().length === 0) return err("Falta el campo 'text'", 400, "no_text");
  if (body.text.length > 5000) return err("El texto supera el límite de 5000 caracteres", 400, "text_too_long");

  const service = await createServiceClient();

  // ── Rate limit por key (anti-abuso): máx RATE_LIMIT requests / 60s ───────
  const RATE_LIMIT = 30;
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count: recent } = await service
    .from("kyma_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", auth.keyId)
    .gte("created_at", since);
  if ((recent ?? 0) >= RATE_LIMIT) {
    return err(`Demasiadas requests. Límite: ${RATE_LIMIT}/minuto por key.`, 429, "rate_limited");
  }

  // ── Créditos por caracteres (mismo pool mensual que la web) ──────────────
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: credit } = await service
    .rpc("kyma_consume_credit_api", { p_user_id: auth.userId, p_month: month, p_chars: body.text.length })
    .single();

  if (credit && !(credit as { ok: boolean }).ok) {
    const c = credit as { used: number; limit: number };
    void service.from("kyma_api_usage").insert({
      api_key_id: auth.keyId, user_id: auth.userId, endpoint: "/v1/generate", status: 429, chars: body.text.length,
    });
    return err(`Límite mensual de caracteres alcanzado (${c.used}/${c.limit}). Actualizá tu plan.`, 429, "credits_exhausted");
  }

  // ── Resolver voz guardada ────────────────────────────────────────────────
  let referenceAudioBase64 = body.referenceAudioBase64;
  let referenceText = body.referenceText;
  if (body.savedVoiceId) {
    const { data: voice } = await service
      .from("kyma_voices")
      .select("storage_path, ref_text, user_id")
      .eq("id", body.savedVoiceId)
      .single();
    if (voice && voice.user_id === auth.userId) {
      const { data: file } = await service.storage.from("kyma-voices").download(voice.storage_path);
      if (file) {
        referenceAudioBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        referenceText = referenceText ?? voice.ref_text ?? undefined;
      }
    }
  }

  // ── Generación ────────────────────────────────────────────────────────────
  const provider = getProvider();
  const startedAt = Date.now();
  try {
    const result = await provider.generate({
      text: body.text,
      language: body.language ?? "es",
      mode: body.mode === "clone" ? "clone" : "design",
      design: body.design,
      referenceAudioBase64,
      referenceText,
      speed: body.speed,
      durationSec: body.durationSec,
      quality: body.quality,
      seed: body.seed,
    });

    void service.from("kyma_api_usage").insert({
      api_key_id: auth.keyId, user_id: auth.userId, endpoint: "/v1/generate", status: 200, chars: body.text.length,
    });
    void service.from("kyma_generations").insert({
      user_id: auth.userId, mode: body.mode ?? "design", language: body.language ?? "es",
      text_length: body.text.length, duration_ms: result.durationMs, rtf: result.rtf, provider: `api:${result.provider}`,
    });

    return NextResponse.json(
      {
        audioBase64: result.audioBase64,
        mime: result.mime,
        durationMs: result.durationMs,
        rtf: result.rtf,
        provider: result.provider,
        latencyMs: Date.now() - startedAt,
      },
      { headers: CORS },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    void service.from("kyma_api_usage").insert({
      api_key_id: auth.keyId, user_id: auth.userId, endpoint: "/v1/generate", status: 500, chars: body.text.length,
    });
    return err(message, 500, "generation_error");
  }
}
