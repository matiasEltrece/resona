import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Endpoint de masterizado en Modal (función CPU). Por defecto se deriva del de generación. */
function masterEndpoint(): string | null {
  if (process.env.OMNIVOICE_MASTER_ENDPOINT) return process.env.OMNIVOICE_MASTER_ENDPOINT;
  const gen = process.env.OMNIVOICE_ENDPOINT;
  return gen ? gen.replace("kyma-generate", "kyma-master") : null;
}

/** POST /api/master — masteriza un WAV. Disponible solo en planes pagos (Creator/Pro). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Iniciá sesión.", code: "login_required" }, { status: 401 });

  const service = await createServiceClient();
  const { data: prof } = await service.from("kyma_profiles").select("plan").eq("id", user.id).single();
  const plan = (prof as { plan?: string } | null)?.plan ?? "free";
  if (!["creator", "pro", "admin"].includes(plan)) {
    return NextResponse.json({ error: "El masterizado está disponible en los planes pagos.", code: "plan_required" }, { status: 403 });
  }

  let body: { audioBase64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.audioBase64) return NextResponse.json({ error: "Falta el audio" }, { status: 400 });

  const ep = masterEndpoint();
  if (!ep) return NextResponse.json({ error: "Masterizado no configurado." }, { status: 503 });

  try {
    const res = await fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_base64: body.audioBase64 }),
    });
    if (!res.ok) return NextResponse.json({ error: "Error del masterizador." }, { status: 502 });
    const data = (await res.json()) as { audio_base64?: string; mime?: string; error?: string };
    if (data.error || !data.audio_base64) return NextResponse.json({ error: data.error ?? "Sin audio." }, { status: 502 });
    return NextResponse.json({ audioBase64: data.audio_base64, mime: data.mime ?? "audio/wav" });
  } catch {
    return NextResponse.json({ error: "No se pudo masterizar (timeout/red)." }, { status: 502 });
  }
}
