import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/inference";
import type { GenerateRequest } from "@/lib/inference";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  // ── Control de créditos ─────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const service = await createServiceClient();

    const { data: credit } = await service.rpc("kyma_consume_credit", {
      p_user_id: user.id,
      p_month: month,
    }).single();

    if (credit && !(credit as { ok: boolean }).ok) {
      return NextResponse.json(
        { error: "Alcanzaste el límite mensual. Actualizá tu plan para continuar.", code: "credits_exhausted" },
        { status: 429 },
      );
    }
  }
  // Usuarios no logueados tienen acceso demo (5 generaciones por sesión se manejan en cliente)

  // ── Generación ──────────────────────────────────────────────────────────
  const provider = getProvider();
  const startedAt = Date.now();

  try {
    const result = await provider.generate({
      text: body.text,
      language: body.language ?? "es",
      mode: body.mode === "clone" ? "clone" : "design",
      design: body.design,
      referenceAudioBase64: body.referenceAudioBase64,
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
      }).then(() => {});
    }

    return NextResponse.json({ ...result, latencyMs: Date.now() - startedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
