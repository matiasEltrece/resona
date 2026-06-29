import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/inference";
import type { GenerateRequest } from "@/lib/inference";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { applyInaudibleWatermark } from "@/lib/watermark";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.text || body.text.trim().length === 0) {
    return NextResponse.json({ error: "Falta el texto" }, { status: 400 });
  }
  if (body.text.length > 5000) {
    return NextResponse.json({ error: "El texto supera el límite de 5000 caracteres" }, { status: 400 });
  }

  // ── Consentimiento obligatorio para clonar (anti-abuso / legal) ──────────
  const isCloneReq = body.mode === "clone" || !!body.referenceAudioBase64 || !!body.savedVoiceId;
  if (isCloneReq && !body.consent) {
    return NextResponse.json(
      { error: "Para clonar una voz tenés que confirmar que es tuya o que tenés permiso para usarla.", code: "consent_required" },
      { status: 400 },
    );
  }

  // ── Control de créditos ─────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Login obligatorio para usar el producto ─────────────────────────────
  if (!user) {
    return NextResponse.json(
      { error: "Iniciá sesión para generar voces.", code: "login_required" },
      { status: 401 },
    );
  }

  let isFreePlan = true;
  if (user) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const service = await createServiceClient();

    const { data: prof } = await service.from("kyma_profiles").select("plan").eq("id", user.id).single();
    const plan = (prof as { plan?: string } | null)?.plan ?? "free";
    isFreePlan = !["creator", "pro", "admin"].includes(plan);

    const { data: credit } = await service.rpc("kyma_consume_credit", {
      p_user_id: user.id,
      p_month: month,
      p_chars: body.text.length,
    }).single();

    if (credit && !(credit as { ok: boolean }).ok) {
      const c = credit as { used: number; limit: number };
      return NextResponse.json(
        {
          error: `Alcanzaste el límite mensual de caracteres (${c.used}/${c.limit}). Actualizá tu plan para continuar.`,
          code: "credits_exhausted",
        },
        { status: 429 },
      );
    }
  }
  // Usuarios no logueados tienen acceso demo (5 generaciones por sesión se manejan en cliente)

  // ── Resolver voz guardada ("Mis voces") ─────────────────────────────────
  let referenceAudioBase64 = body.referenceAudioBase64;
  let referenceText = body.referenceText;
  if (body.savedVoiceId && user) {
    const service = await createServiceClient();
    const { data: voice } = await service
      .from("kyma_voices")
      .select("storage_path, ref_text, user_id")
      .eq("id", body.savedVoiceId)
      .single();

    if (voice && voice.user_id === user.id && voice.storage_path) {
      const { data: file } = await service.storage
        .from("kyma-voices")
        .download(voice.storage_path);
      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        referenceAudioBase64 = buf.toString("base64");
        referenceText = referenceText ?? voice.ref_text ?? undefined;
      }
    }
  }

  // ── Generación ──────────────────────────────────────────────────────────
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
      savedVoiceId: body.savedVoiceId,
      speed: body.speed,
      durationSec: body.durationSec,
      quality: body.quality,
      seed: body.seed,
    });

    // Registrar generación en historial (sin bloquear respuesta)
    if (user) {
      const service = await createServiceClient();
      service.from("kyma_generations").insert({
        user_id: user.id,
        mode: body.mode ?? "design",
        language: body.language ?? "es",
        text_length: body.text.length,
        duration_ms: result.durationMs,
        rtf: result.rtf,
        provider: result.provider,
        consent: isCloneReq ? true : null,
      }).then(() => {});
    }

    const audioBase64 = isFreePlan ? applyInaudibleWatermark(result.audioBase64) : result.audioBase64;
    return NextResponse.json({ ...result, audioBase64, commercial: !isFreePlan, latencyMs: Date.now() - startedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
